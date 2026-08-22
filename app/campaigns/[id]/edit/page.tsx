import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import EditCampaignForm from "./EditCampaign";

interface EditCampaignProps {
  params: Promise<{ id: string}>
}

export default async function EditCampaignPage({params} : EditCampaignProps){
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: {
      id
    }
  })

  if(!campaign){
    notFound();
  }

  return <EditCampaignForm initialCampaign={campaign} />
}