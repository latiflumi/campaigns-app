"use server"

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache"
import { z } from "zod";
import { Campaign } from "../types/CampaignTypes";

const CampaignSchema = z.object ({
    id: z.string(),
    name: z.string().min(2, "Emri duhet te kete te pakten 2 shkronja"),
    type: z.enum(['STORE', 'ECOMMERCE', 'SMS', 'EMAIL']),
    status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'PAUSED']),
    subject: z.string().optional(),
    participatingStores: z.array(z.string()).default([]),
    budget: z.string().nullable().optional().transform((val) => val || null),
    content: z.string().optional(),
    startDate: z.coerce.date(),
    endDate:z.coerce.date()
})

export async function createCampaign(formData: {
  name: string
  type: 'STORE' | 'ECOMMERCE' | 'SMS' | 'EMAIL'
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'
  subject?: string
  participatingStores?: string[]
  budget?: string | null
  content?: string
  startDate: string | null
  endDate: string | null
}) {
  try {
    const validatedFields = CampaignSchema.parse({
      ...formData,
    });

    await prisma.campaign.create({
      data: validatedFields,
    });

    revalidatePath("/campaigns");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message };
    }
    console.log(error);
    return { success: false, error: "Gabim gjatë krijimit të kampanjës" };
  }
}

export async function updateCampaign(campaignId: string, formData: Campaign) {
  try {
    const validatedFields = CampaignSchema.parse({
      ...formData,
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: validatedFields,
    });

    revalidatePath("/campaigns");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message };
    }
    console.log(error);
    return { success: false, error: "Gabim gjatë përditësimit të kampanjës" };
  }
}

export async function deleteCampaign(campaignId: string){
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
      id:true,
      name:true
    },
    orderBy:{
      name:'asc'
    }
  })
}

export async function fetchChannelsAction() {
    return await prisma.campaign.findMany({
      distinct: ['type'],  
      select: {
            type: true,
        },
        orderBy:{
            type:'asc',
        }
    })
}

export async function getCampaignById(id:string) {

  return await prisma.campaign.findUnique({
    where: { id },
    select: {
      id:true,
      name:true,
      type:true,
      status:true,
      subject:true,
      participatingStores:true,
      budget:true,
      startDate:true,
      endDate:true,
      content:true,
      createdAt:true,
      updatedAt:true
    }
  })  
}