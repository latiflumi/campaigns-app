// prisma/seed.ts
import { prisma } from "@/app/lib/prisma"

const stores = [
  "VERO MODA Prizren",
  "JACK&JONES Prizren",
  "A&M CLOTHES Ferizaj",
  "A&M CLOTHES Lipjan",
  "S.OLIVER Prizren",
  "A&M CLOTHES Shesh",
  "VERO MODA Albi Mall",
  "A&M CLOTHES Albi Mall",
  "A&M CLOTHES Pejë",
  "A&M CLOTHES Mitrovice",
  "NAME IT Albi Mall",
  "NAME IT Royal Mall",
  "NAME IT Abi Carshia",
  "ONLY Royal Mall",
  "ONLY Abi Carshia",
  "A&M CLOTHES Royal Mall",
  "JACK&JONES Ferizaj",
  "A&M Clothes Gjakove",
  "A&M Clothes Gjilan",
  "A&M CLOTHES Galeri",
  "A&M CLOTHES Park Plaza",
  "JACK&JONES Mall of Mitrovica",
  "JACK&JONES Prishtina Mall",
  "S.OLIVER Prishtina Mall",
  "JACK&JONES Albi Mall",
  "JACK&JONES Peje",
  "S.OLIVER Peje",
  "JACK&JONES Gjilan",
  "VERO MODA Ring Mall",
  "VERO MODA GALERI",
  "JACK&JONES GALERI",
  "A&M CLOTHES Prishtina Mall",
  "JACK&JONES GRANDE CALABRIA"
];

async function main() {
  console.log('Seeding stores...')

  for (const name of stores) {
    await prisma.store.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log('Stores seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })