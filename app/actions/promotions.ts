"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Promotion } from "@/lib/types";

export async function getPromotions(companyId: string) {
  try {
    const promotions = await prisma.promotion.findMany({
      where: { companyId },
      include: {
        product: {
          select: {
            price: true,
            name: true,
            image: true,
            description: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Transform to match the frontend type (including originalPrice from product)
    return promotions.map((p) => ({
      ...p,
      originalPrice: p.product.price,
    }));
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return [];
  }
}

export async function createPromotion(companyId: string, data: any) {
  console.log("Creating promotion for company:", companyId, "Data:", data);
  try {
    if (!data.productId) {
      throw new Error("Produto é obrigatório");
    }
    if (!data.promotionalPrice) {
      throw new Error("Preço promocional é obrigatório");
    }

    const promoPrice = parseFloat(data.promotionalPrice);
    if (isNaN(promoPrice)) {
      throw new Error("Preço promocional inválido");
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Datas inválidas");
    }

    // Optional: Check if product belongs to company
    const product = await prisma.product.findFirst({
      where: { id: data.productId, companyId },
    });

    if (!product) {
      throw new Error("Produto não encontrado ou não pertence a esta empresa");
    }

    const promotion = await prisma.promotion.create({
      data: {
        companyId,
        productId: data.productId,
        promotionalPrice: promoPrice,
        startDate: startDate,
        endDate: endDate,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/empresa/dashboard/promocoes");
    return { success: true, promotion };
  } catch (error: any) {
    console.error("Error creating promotion:", error);
    return {
      success: false,
      error: error.message || "Failed to create promotion",
    };
  }
}

export async function updatePromotion(
  id: string,
  companyId: string,
  data: any,
) {
  try {
    const existing = await prisma.promotion.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Promotion not found or access denied" };
    }

    const promoPrice = parseFloat(data.promotionalPrice);
    if (isNaN(promoPrice)) {
      throw new Error("Preço promocional inválido");
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Datas inválidas");
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        productId: data.productId,
        promotionalPrice: promoPrice,
        startDate: startDate,
        endDate: endDate,
        isActive: data.isActive,
      },
    });

    revalidatePath("/empresa/dashboard/promocoes");
    return { success: true, promotion };
  } catch (error: any) {
    console.error("Error updating promotion:", error);
    return {
      success: false,
      error: error.message || "Failed to update promotion",
    };
  }
}

export async function deletePromotion(id: string, companyId: string) {
  try {
    const existing = await prisma.promotion.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Promotion not found or access denied" };
    }

    await prisma.promotion.delete({
      where: { id },
    });

    revalidatePath("/empresa/dashboard/promocoes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return { success: false, error: "Failed to delete promotion" };
  }
}

export async function togglePromotionStatus(id: string, companyId: string) {
  try {
    const existing = await prisma.promotion.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Promotion not found or access denied" };
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });

    revalidatePath("/empresa/dashboard/promocoes");
    return { success: true, promotion };
  } catch (error) {
    console.error("Error toggling promotion status:", error);
    return { success: false, error: "Failed to toggle promotion status" };
  }
}
