import { prisma } from "@/app/lib/prisma"

// Extracted data mapped to your Campaign model shape
const rawCampaigns = [
  { name: "Blej 2+ artikuj te zbritjes, fito 10% ekstra ulje", startDate: "2025-08-18", endDate: "2025-09-01" },
  { name: "50% ulje krejt artikujt me tikete te kuqe", startDate: "2025-08-20", endDate: "2025-09-11" },
  { name: "Back to School 20% – 50% ulje në të gjithë artikujt", startDate: "2025-08-20", endDate: "2025-09-11" },
  { name: "20% ulje extra ne krejt artikujt", startDate: "2025-08-25", endDate: "2025-09-15" },
  { name: "Xhinse 50% Ulje ne te 2-ten", startDate: "2025-08-28", endDate: "2025-09-07" },
  { name: "Xhinse 50% Ulje ne te 2-ten", startDate: "2025-09-05", endDate: "2025-09-19" },
  { name: "Tops 50% ne te 2-ten", startDate: "2025-09-08", endDate: "2025-09-21" },
  { name: "Tops 50% ne te 2-ten", startDate: "2025-09-12", endDate: "2025-09-30" }, // standardizing 31/09 -> 30/09
  { name: "Tops 50% ne te 2-ten", startDate: "2025-09-16", endDate: "2025-09-30" },
  { name: "Tops 50% ne te 2-ten", startDate: "2025-09-20", endDate: "2025-09-30" },
  { name: "Java e xhaketave", startDate: "2025-10-01", endDate: "2025-10-12" },
  { name: "Java e xhaketave", startDate: "2025-10-01", endDate: "2025-10-12" },
  { name: "Pantallona 50% ulje ne te 2-ten", startDate: "2025-10-01", endDate: "2025-10-12" },
  { name: "TOPS 25% ulje", startDate: "2025-10-13", endDate: "2025-10-27" },
  { name: "TOPS- 50% ulje ne dyten", startDate: "2025-10-13", endDate: "2025-10-27" },
  { name: "Xhinse 50% Ulje ne te 2-ten", startDate: "2025-10-20", endDate: "2025-11-09" },
  { name: "Hallween Sale / 20% deri 50% ulje krejt artikujt", startDate: "2025-10-28", endDate: "2025-11-02" },
  { name: "Xhinse 50% ulje ne 2-ten", startDate: "2025-10-30", endDate: "2025-11-10" },
  { name: "Pulovera sportiv 2 Per 70 EUR", startDate: "2025-11-03", endDate: null },
  { name: "Pulovera/Knits 2 Per 70", startDate: "2025-11-03", endDate: null },
  { name: "Festojm pervjetorin, 20% ulje ne krejt artikujt", startDate: "2025-11-03", endDate: "2025-11-16" },
  { name: "20% ulje ne krejt artikujt.", startDate: "2025-11-03", endDate: "2025-11-16" },
  { name: "Pulover- 50% ulje ne te 2ten.", startDate: "2025-11-03", endDate: "2025-11-09" },
  { name: "Pantallona 50% ulje ne te 2-ten", startDate: "2025-11-10", endDate: "2025-11-22" },
  { name: "Black Week 30% ulje ne te gjitha xhaketat", startDate: "2025-11-17", endDate: "2025-11-23" },
  { name: "Black Friday 30% ulje ne krejt artikujt", startDate: "2025-11-24", endDate: "2025-12-02" },
  { name: "Black Week 30% ulje ne te gjitha xhaketat", startDate: "2025-11-17", endDate: "2025-11-23" },
  { name: "Black Week 30% ulje ne te gjitha xhaketat", startDate: "2025-11-24", endDate: "2025-11-30" }, // standardizing 31/11 -> 30/11
  { name: "Pre Winter Week", startDate: "2025-12-03", endDate: "2025-12-22" },
  { name: "Pre Winter Week", startDate: "2025-12-05", endDate: "2025-12-14" },
  { name: "50% Ulje krejt artikujt", startDate: "2025-12-08", endDate: "2026-01-19" },
  { name: "Ulje Sezonale", startDate: "2025-12-14", endDate: "2026-01-20" },
  { name: "Ulje mezonale", startDate: "2025-12-22", endDate: "2026-01-26" },
  { name: "50% ULJE KREJT ARTIKUJT", startDate: "2025-12-20", endDate: "2026-01-23" },
]

async function main() {
  console.log('Seeding campaign list...')

  const dataToInsert = rawCampaigns.map((item) => ({
    name: item.name,
    startDate: item.startDate ? new Date(item.startDate) : null,
    endDate: item.endDate ? new Date(item.endDate) : null,
    type: 'STORE' as const, // Enum default
    status: 'COMPLETED' as const, // Enum default or set to DRAFT
  }))

  const result = await prisma.campaign.createMany({
    data: dataToInsert,
  })

  console.log(`Successfully seeded ${result.count} campaigns!`)
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })