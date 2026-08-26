import { prisma } from "@/app/lib/prisma"

const stores = [
  { id: 10, name: "A&M SHPK" },
  { id: 11, name: "Doganore" },
  { id: 12, name: "VERO MODA Prizren" },
  { id: 13, name: "JACK&JONES Prizren" },
  { id: 14, name: "A&M CLOTHES Ferizaj" },
  { id: 15, name: "A&M CLOTHES Lipjan" },
  { id: 16, name: "S.OLIVER Albi Mall" },
  { id: 17, name: "S.OLIVER Prizren" },
  { id: 18, name: "A&M CLOTHES Shesh" },
  { id: 19, name: "VERO MODA Albi Mall" },
  { id: 20, name: "AM CAFFE" },
  { id: 21, name: "A&M CLOTHES Albi Mall" },
  { id: 22, name: "A&M CLOTHES Pejë" },
  { id: 23, name: "A&M CLOTHES Mitrovice" },
  { id: 24, name: "NAME IT Albi Mall" },
  { id: 25, name: "NAME IT Royal Mall" },
  { id: 26, name: "NAME IT Abi Carshia" },
  { id: 27, name: "ONLY Royal Mall" },
  { id: 28, name: "ONLY Abi Carshia" },
  { id: 29, name: "A&M CLOTHES Royal Mall" },
  { id: 30, name: "JACK&JONES Ferizaj" },
  { id: 31, name: "A&M SHPK 2" }, // Duplicate label fallback if required
  { id: 32, name: "A&M Clothes Gjakove" },
  { id: 33, name: "A&M CLOTHES Galeri" },
  { id: 34, name: "A&M CLOTHES Park Plaza" },
  { id: 35, name: "A&M Clothes Gjilan" },
  { id: 36, name: "JACK&JONES Mall of Mitrovica" },
  { id: 37, name: "A&M OUTLET Fushe Kosove" },
  { id: 38, name: "A&M Auto" },
  { id: 39, name: "JACK&JONES Prishtina Mall" },
  { id: 40, name: "S.OLIVER Prishtina Mall" },
  { id: 41, name: "JACK&JONES Albi Mall" },
  { id: 42, name: "JACK&JONES Peje" },
  { id: 43, name: "S.OLIVER Peje" },
  { id: 44, name: "JACK&JONES Gjilan" },
  { id: 45, name: "VERO MODA Ring Mall" },
  { id: 46, name: "VERO MODA GALERI" },
  { id: 47, name: "JACK&JONES GALERI" },
  { id: 48, name: "A&M CLOTHES Prishtina Mall" },
  { id: 50, name: "JACK&JONES GRANDE CALABRIA" },
];

async function main() {
  console.log("🌱 Seeding stores with integer ERP IDs...");

  for (const store of stores) {
    await prisma.store.upsert({
      where: { id: store.id },
      update: { name: store.name },
      create: {
        id: store.id,
        name: store.name,
      },
    });
  }

  console.log("✅ Stores seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });