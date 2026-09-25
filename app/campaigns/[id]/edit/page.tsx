import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import EditCampaignForm from "./EditCampaign";
import { requireAdminPage } from "@/app/lib/roles";

interface EditCampaignProps {
  params: Promise<{ id: string}>
}

export default async function EditCampaignPage({params} : EditCampaignProps){
  await requireAdminPage(); // viewers are sent back to /campaigns
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