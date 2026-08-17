"use server"

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod";

const CampaignSchema = z.object ({ 
    name: z.string().min(2, "Emri duhet te kete te pakten 2 shkronja"),
    type: z.enum(['EMAIL', 'SOCIAL', 'SEARCH', 'PUSH']),
    status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'PAUSED']),
    subject: z.string().optional(),
    participatingStores: z.array(z.string()).default([]),
    budget: z.number().nullable().optional(),
    content: z.string().optional(),
    startDate: z.coerce.date(),
    endDate:z.coerce.date()
})
.refine((data) => {
    if(data.startDate && data.endDate){
        return data.endDate >= data.startDate
    }
    return true
}, {
    message:"Data e perfundimit nuk mund te jete me e madhe se data e fillimit",
    path:["endDate"],
})

export async function createCampaign(formData:{
    name: string
    type: 'EMAIL' | 'SOCIAL' | 'SEARCH' | 'PUSH'
    status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED'
    subject?: string
    participatingStores?: string[]
    budget?: number | number
    content?: string,
    startDate: string | null,
    endDate: string | null
}) {
    const vaildatedFields = CampaignSchema.parse({
        ...formData,
        budget: formData.budget ? Number(formData.budget) : null,
    })
    const newCampaign = await prisma.campaign.create({
        data : {
            name: vaildatedFields.name,
            type: vaildatedFields.type,
            status: vaildatedFields.status,
            subject: vaildatedFields.subject,
            participatingStores: vaildatedFields.participatingStores,
            budget: vaildatedFields.budget,
            content: vaildatedFields.content,
            startDate: vaildatedFields.startDate,
            endDate: vaildatedFields.endDate,
        },
    })

    revalidatePath("/campaigns")

    redirect("/campaigns")
}