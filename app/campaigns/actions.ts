"use server"

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache"
import { z } from "zod";
import { Campaign, CampaignType, CampaignStatus } from "../types/CampaignTypes";

// Base Zod Schema matching your Prisma model constraints
const BaseCampaignSchema = z.object({
  name: z.string().min(2, "Emri duhet te kete te pakten 2 shkronja"),
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
const UpdateCampaignSchema = BaseCampaignSchema.extend({
  id: z.string(),
})

export async function createCampaign(formData: {
  name: string
  type: CampaignType
  status: CampaignStatus
  subject?: string | null
  participatingStores?: string[]
  budget?: string | null
  content?: string | null
  startDate?: string | Date | null
  endDate?: string | Date | null
}) {
  try {
    // Validate form inputs (without requiring id)
    const validatedFields = BaseCampaignSchema.parse(formData);

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
    return { success: false, error: "Gabim gjatë krijimit të kampanjës" };
  }
}

export async function updateCampaign(campaignId: string, formData: Partial<Campaign>) {
  try {
    const validatedFields = UpdateCampaignSchema.parse({
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
    return { success: false, error: "Gabim gjatë përditësimit të kampanjës" };
  }
}

export async function deleteCampaign(campaignId: string) {
  try {
    await prisma.campaign.delete({
      where: { id: campaignId },
    });
    revalidatePath("/campaigns");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gabim gjatë fshirjes së kampanjës" };
  }
}

export async function fetchStoresAction() {
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