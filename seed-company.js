const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const connectionString =
  "postgresql://neondb_owner:npg_XLfiD5b3epsZ@ep-quiet-unit-acjmlev8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString:
    connectionString +
    (connectionString.includes("?") ? "&" : "?") +
    "uselibpqcompat=true",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  try {
    console.log("Iniciando criação da empresa...");

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const company = await prisma.company.upsert({
      where: { slug: "quero-mais-salgaderia" },
      update: {},
      create: {
        name: "Quero Mais Salgaderia",
        slug: "quero-mais-salgaderia",
        description:
          "Os melhores salgados da cidade! Tradição e sabor em cada mordida.",
        profileImage: "",
        bannerImage: "",
        phone: ["(11) 99999-9999"],
        whatsapp: "5511999999999",
        minimumOrder: 19.99,
        address: {
          cep: "01310-100",
          street: "Av. Paulista",
          number: "1000",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
        },
        businessHours: [
          {
            dayOfWeek: 0,
            dayName: "Domingo",
            isOpen: false,
            openTime: "",
            closeTime: "",
          },
          {
            dayOfWeek: 1,
            dayName: "Segunda",
            isOpen: true,
            openTime: "08:00",
            closeTime: "18:00",
          },
          {
            dayOfWeek: 2,
            dayName: "Terça",
            isOpen: true,
            openTime: "08:00",
            closeTime: "18:00",
          },
          {
            dayOfWeek: 3,
            dayName: "Quarta",
            isOpen: true,
            openTime: "08:00",
            closeTime: "18:00",
          },
          {
            dayOfWeek: 4,
            dayName: "Quinta",
            isOpen: true,
            openTime: "08:00",
            closeTime: "18:00",
          },
          {
            dayOfWeek: 5,
            dayName: "Sexta",
            isOpen: true,
            openTime: "08:00",
            closeTime: "20:00",
          },
          {
            dayOfWeek: 6,
            dayName: "Sábado",
            isOpen: true,
            openTime: "09:00",
            closeTime: "15:00",
          },
        ],
        paymentMethods: ["cash", "credit", "debit", "pix"],
        averagePreparationTime: 40,
        isOpen: true,
      },
    });

    console.log(
      "Empresa criada/verificada com sucesso:",
      company.name,
      "(ID:",
      company.id,
      ")",
    );

    // Criar um usuário admin para essa empresa se não existir
    const user = await prisma.user.upsert({
      where: { email: "admin@salgaderia.com" },
      update: {
        companyId: company.id,
        password: hashedPassword,
        role: "admin",
      },
      create: {
        email: "admin@salgaderia.com",
        password: hashedPassword,
        name: "Administrador",
        role: "admin",
        companyId: company.id,
      },
    });

    console.log("Usuário admin criado/vinculado:", user.email);
    console.log("Senha definida como: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Erro no seed:", error);
    process.exit(1);
  }
}

seed();
