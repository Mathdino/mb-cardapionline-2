import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = envContent.split("\n").reduce(
  (acc, line) => {
    const [key, ...value] = line.split("=");
    if (key && value) {
      acc[key.trim()] = value.join("=").trim().replace(/"/g, "");
    }
    return acc;
  },
  {} as Record<string, string>,
);

const connectionString = envVars.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("No company found");
    return;
  }

  console.log(`Using company: ${company.name} (${company.id})`);

  // 1. Create an empty category
  const categoryName = `Empty Category ${Date.now()}`;
  const category = await prisma.category.create({
    data: {
      companyId: company.id,
      name: categoryName,
      order: 999,
    },
  });

  const categoryId = category.id;
  console.log(`Created category: ${categoryName} (${categoryId})`);

  // 2. Try to create a combo in this category (simulating createProduct action)
  const comboData = {
    name: "Test Combo",
    description: "Test Description",
    price: 10,
    categoryId: categoryId,
    image: "",
    productType: "combo",
    ingredients: [],
    flavors: Prisma.DbNull,
    comboConfig: {
      maxItems: "1",
      options: [],
      groups: [],
    },
  };

  console.log("Attempting to create combo...");
  try {
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        ...comboData,
      },
    });

    console.log("SUCCESS: Combo created successfully in empty category!");
    console.log("Product ID:", product.id);

    // Clean up
    await prisma.product.delete({ where: { id: product.id } });
  } catch (error) {
    console.error("FAILURE: Failed to create combo:", error);
  }

  // Clean up category
  await prisma.category.delete({ where: { id: categoryId } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
