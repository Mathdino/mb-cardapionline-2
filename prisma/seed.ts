import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString:
    connectionString && !connectionString.includes("uselibpqcompat")
      ? `${connectionString}${connectionString.includes("?") ? "&" : "?"}uselibpqcompat=true`
      : connectionString,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const businessHours = [
    {
      dayOfWeek: 1,
      dayName: "Segunda",
      isOpen: true,
      openTime: "08:00",
      closeTime: "22:00",
    },
    {
      dayOfWeek: 2,
      dayName: "Terça",
      isOpen: true,
      openTime: "08:00",
      closeTime: "22:00",
    },
    {
      dayOfWeek: 3,
      dayName: "Quarta",
      isOpen: true,
      openTime: "08:00",
      closeTime: "22:00",
    },
    {
      dayOfWeek: 4,
      dayName: "Quinta",
      isOpen: true,
      openTime: "08:00",
      closeTime: "22:00",
    },
    {
      dayOfWeek: 5,
      dayName: "Sexta",
      isOpen: true,
      openTime: "08:00",
      closeTime: "23:00",
    },
    {
      dayOfWeek: 6,
      dayName: "Sábado",
      isOpen: true,
      openTime: "08:00",
      closeTime: "23:00",
    },
    {
      dayOfWeek: 0,
      dayName: "Domingo",
      isOpen: true,
      openTime: "08:00",
      closeTime: "22:00",
    },
  ];

  const company = await prisma.company.upsert({
    where: { slug: "restaurante-exemplo" },
    update: {
      businessHours: businessHours,
    },
    create: {
      name: "Restaurante Exemplo",
      slug: "restaurante-exemplo",
      description: "O melhor restaurante da região.",
      profileImage: "https://via.placeholder.com/150",
      bannerImage: "https://via.placeholder.com/800x200",
      phone: ["(11) 99999-9999"],
      whatsapp: "5511999999999",
      minimumOrder: 15.0,
      address: {
        street: "Rua Exemplo",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        cep: "01001-000",
      },
      businessHours: businessHours,
      paymentMethods: ["cash", "pix", "credit", "debit"],
      averagePreparationTime: 40,
      isOpen: true,
    },
  });

  const passwordHash = await hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {
      password: passwordHash,
      companyId: company.id,
      role: "company_owner",
    },
    create: {
      email: "admin@empresa.com",
      name: "Admin Empresa",
      password: passwordHash,
      role: "company_owner",
      companyId: company.id,
    },
  });

  const category = await prisma.category.create({
    data: {
      name: "Lanches",
      order: 1,
      companyId: company.id,
    },
  });

  await prisma.product.create({
    data: {
      name: "X-Bacon",
      description: "Pão, hambúrguer, queijo, bacon e salada.",
      image: "https://via.placeholder.com/150",
      price: 25.0,
      productType: "unit",
      isAvailable: true,
      companyId: company.id,
      categoryId: category.id,
      ingredients: ["Pão", "Carne", "Queijo", "Bacon", "Alface", "Tomate"],
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
