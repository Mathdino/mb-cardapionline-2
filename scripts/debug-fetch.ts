import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      let value = valueParts.join("=").trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key.trim()] = value;
    }
  });
}

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
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      console.error("No company found");
      return;
    }

    console.log("Using company:", company.id);

    // 1. Create empty category
    const category = await prisma.category.create({
      data: {
        companyId: company.id,
        name: "Debug Empty Cat " + Date.now(),
        order: 999,
      },
    });
    console.log("Created category:", category.id);

    // 2. Create combo in it
    const combo = await prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: category.id,
        name: "Debug Combo " + Date.now(),
        description: "Desc",
        price: 10,
        productType: "combo",
        image: "",
        comboConfig: {
          maxItems: 1,
          options: [],
          groups: [],
        }, // Pass JSON object directly
      },
    });
    console.log("Created combo:", combo.id);

    // 3. Fetch products like the frontend does
    const products = await prisma.product.findMany({
      where: { companyId: company.id },
      include: { category: true },
      orderBy: { name: "asc" },
    });

    // 4. Check if combo is there
    const found = products.find((p) => p.id === combo.id);
    if (found) {
      console.log("Combo found in fetch!");
      console.log(
        "Category attached:",
        found.category ? found.category.name : "NO CATEGORY",
      );
    } else {
      console.error("Combo NOT found in fetch!");
    }

    // Cleanup
    await prisma.product.delete({ where: { id: combo.id } });
    await prisma.category.delete({ where: { id: category.id } });
    console.log("Cleanup done.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
