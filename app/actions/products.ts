"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getProducts(companyId: string) {
  try {
    const products = await prisma.product.findMany({
      where: { companyId },
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getStoreProducts(companyId: string) {
  try {
    const now = new Date();
    const products = await prisma.product.findMany({
      where: { companyId },
      include: {
        category: true,
        promotions: {
          where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return products.map((item) => {
      // Extract promotions to avoid returning it if not in type,
      // but we need to access it first.
      const { promotions, ...product } = item;
      const activePromotion = promotions && promotions[0];

      if (activePromotion) {
        return {
          ...product,
          isPromotion: true,
          promotionalPrice: activePromotion.promotionalPrice,
        };
      }
      return product;
    });
  } catch (error) {
    console.error("Error fetching store products:", error);
    return [];
  }
}

export async function createProduct(companyId: string, data: any) {
  try {
    console.log("Creating product - Start");
    console.log("Company ID:", companyId);
    console.log("Data size:", JSON.stringify(data).length);
    // console.log("Data:", JSON.stringify(data, null, 2)); // Too verbose for large images

    const processedData = { ...data };
    if (processedData.flavors === null) processedData.flavors = Prisma.DbNull;
    if (processedData.comboConfig === null)
      processedData.comboConfig = Prisma.DbNull;
    if (processedData.complements === null)
      processedData.complements = Prisma.DbNull;

    const product = await prisma.product.create({
      data: {
        companyId,
        ...processedData,
      },
    });

    console.log("Product created successfully:", product.id);

    // Revalidate dashboard paths
    revalidatePath("/empresa/dashboard/produtos");
    revalidatePath("/empresa/dashboard/promocoes");

    // Revalidate store page
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });
    if (company) {
      revalidatePath(`/${company.slug}`);
    }

    // Ensure serializability
    return JSON.parse(JSON.stringify({ success: true, product }));
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProduct(id: string, companyId: string, data: any) {
  try {
    console.log("Updating product - Start");
    console.log("Product ID:", id);
    console.log("Data size:", JSON.stringify(data).length);

    const existing = await prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Product not found or access denied" };
    }

    const processedData = { ...data };
    if (processedData.flavors === null) processedData.flavors = Prisma.DbNull;
    if (processedData.comboConfig === null)
      processedData.comboConfig = Prisma.DbNull;
    if (processedData.complements === null)
      processedData.complements = Prisma.DbNull;

    // Filter out undefined values to ensure Prisma only updates fields that are actually present
    // This fixes issues where undefined values might override existing data or cause errors
    const cleanData: any = {};
    Object.keys(processedData).forEach((key) => {
      if (processedData[key] !== undefined) {
        cleanData[key] = processedData[key];
      }
    });

    const product = await prisma.product.update({
      where: { id },
      data: cleanData,
    });

    console.log("Product updated successfully");

    // Revalidate dashboard paths
    revalidatePath("/empresa/dashboard/produtos");
    revalidatePath("/empresa/dashboard/promocoes");

    // Revalidate store page
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });
    if (company) {
      revalidatePath(`/${company.slug}`);
    }

    return JSON.parse(JSON.stringify({ success: true, product }));
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function deleteProduct(id: string, companyId: string) {
  try {
    const existing = await prisma.product.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Product not found or access denied" };
    }

    // Delete related promotions first to avoid foreign key constraint violations
    await prisma.promotion.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    // Revalidate dashboard paths
    revalidatePath("/empresa/dashboard/produtos");
    revalidatePath("/empresa/dashboard/promocoes");

    // Revalidate store page
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });
    if (company) {
      revalidatePath(`/${company.slug}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}
