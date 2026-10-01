"use server"

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache"
import { z } from "zod";
import { requireSession } from "../lib/session";
import { isAdmin } from "../lib/roles";
import { getT } from "../lib/i18n/server";
import type { Dict } from "../lib/i18n/dictionaries";

// Server actions are public POST endpoints, so each one checks the session itself.
// requireSession() redirects to /login; it stays outside try/catch because redirect() throws.
// Writes (create / update / delete) additionally require the ADMIN role; viewers can only read.

// Base Zod Schema matching your Prisma model constraints (messages in the caller's language)
const baseCampaignSchema = (t: Dict) => z.object({
  name: z.string().min(2, t.serverErrors.nameMin),
  type: z.enum(['STORE', 'ECOMMERCE', 'SMS', 'EMAIL']),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'PAUSED']),
  subject: z.string().optional().nullable(),
  participatingStores: z.array(z.string()).default([]),
  budget: z.string().nullable().optional().transform((val) => val || null),
  content: z.string().optional().nullable(),
  
  // Transform empty string "" or null into null, otherwise coerce string/Date to Date
  startDate: z
    .union([z.string(), z.date(), z.null()])
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
    
  endDate: z
    .union([z.string(), z.date(), z.null()])
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
})

// Schema for updating (includes id)
const updateCampaignSchema = (t: Dict) => baseCampaignSchema(t).extend({
  id: z.string(),
})

/** What the create/edit forms send: dates as "YYYY-MM-DD" strings (or Date), which the schema converts. */
export type CampaignFormInput = z.input<ReturnType<typeof baseCampaignSchema>>

export async function createCampaign(formData: CampaignFormInput) {
  const session = await requireSession()
  const t = await getT()
  if (!(await isAdmin(session))) return { success: false, error: t.serverErrors.forbidden }
  try {
    // Validate form inputs (without requiring id)
    const validatedFields = baseCampaignSchema(t).parse(formData);

    await prisma.campaign.create({
      data: validatedFields,
    });

    revalidatePath("/campaigns");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Error (create):", error.flatten());
      return { success: false, error: error.issues[0]?.message };
    }
    console.error("Database Error:", error);
    return { success: false, error: t.serverErrors.createFailed };
  }
}

export async function updateCampaign(campaignId: string, formData: CampaignFormInput) {
  const session = await requireSession()
  const t = await getT()
  if (!(await isAdmin(session))) return { success: false, error: t.serverErrors.forbidden }
  try {
    const validatedFields = updateCampaignSchema(t).parse({
      ...formData,
      id: campaignId,
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: validatedFields,
    });

    revalidatePath("/campaigns");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod Validation Error (update):", error.flatten());
      return { success: false, error: error.issues[0]?.message };
    }
    console.error("Database Error:", error);
    return { success: false, error: t.serverErrors.updateFailed };
  }
}

export async function deleteCampaign(campaignId: string) {
  const session = await requireSession()
  const t = await getT()
  if (!(await isAdmin(session))) return { success: false, error: t.serverErrors.forbidden }
  try {
    await prisma.campaign.delete({
      where: { id: campaignId },
    });
    revalidatePath("/campaigns");
    return { success: true };
  } catch (error) {
    console.error("Database Error (delete):", error);
    return { success: false, error: t.serverErrors.deleteFailed };
  }
}

export async function fetchStoresAction() {
  await requireSession()
  return await prisma.store.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
}

export async function fetchChannelsAction() {
  await requireSession()
  return await prisma.campaign.findMany({
    distinct: ['type'],
    select: {
      type: true,
    },
    orderBy: {
      type: 'asc',
    },
  })
}

export async function getCampaignById(id: string) {
  await requireSession()
  return await prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      subject: true,
      participatingStores: true,
      budget: true,
      startDate: true,
      endDate: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}