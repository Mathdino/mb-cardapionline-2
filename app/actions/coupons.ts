"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCoupons(companyId: string) {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return coupons;
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
}

export async function createCoupon(companyId: string, data: any) {
  try {
    // Check if code already exists for this company
    const existing = await prisma.coupon.findFirst({
      where: {
        companyId,
        code: { equals: data.code, mode: "insensitive" },
      },
    });

    if (existing) {
      return { success: false, error: "Já existe um cupom com este código." };
    }

    const coupon = await prisma.coupon.create({
      data: {
        companyId,
        code: data.code.toUpperCase(),
        type: data.type,
        value: parseFloat(data.value),
        minOrderValue: data.minOrderValue ? parseFloat(data.minOrderValue) : null,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        isActive: true,
      },
    });

    revalidatePath("/empresa/dashboard/cupons");
    return { success: true, coupon };
  } catch (error) {
    console.error("Error creating coupon:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar cupom",
    };
  }
}

export async function toggleCouponStatus(id: string, companyId: string) {
  try {
    const coupon = await prisma.coupon.findFirst({
      where: { id, companyId },
    });

    if (!coupon) {
      return { success: false, error: "Cupom não encontrado" };
    }

    await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    revalidatePath("/empresa/dashboard/cupons");
    return { success: true };
  } catch (error) {
    console.error("Error toggling coupon:", error);
    return { success: false, error: "Erro ao atualizar status do cupom" };
  }
}

export async function deleteCoupon(id: string, companyId: string) {
  try {
    await prisma.coupon.delete({
      where: { id, companyId },
    });

    revalidatePath("/empresa/dashboard/cupons");
    return { success: true };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return { success: false, error: "Erro ao excluir cupom" };
  }
}

export async function validateCoupon(code: string, companyId: string, orderTotal: number) {
  try {
    const coupon = await prisma.coupon.findFirst({
      where: {
        companyId,
        code: { equals: code, mode: "insensitive" },
        isActive: true,
      },
    });

    if (!coupon) {
      return { valid: false, message: "Cupom inválido ou não encontrado." };
    }

    const now = new Date();

    // Check dates
    if (coupon.startDate && now < coupon.startDate) {
      return { valid: false, message: "Cupom ainda não está ativo." };
    }

    if (coupon.expirationDate && now > coupon.expirationDate) {
      return { valid: false, message: "Cupom expirado." };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, message: "Limite de uso do cupom excedido." };
    }

    // Check minimum order value
    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return { 
        valid: false, 
        message: `Valor mínimo para este cupom é R$ ${coupon.minOrderValue.toFixed(2).replace('.', ',')}.` 
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderTotal * coupon.value) / 100;
      // Apply max discount limit if set
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      // Fixed value
      discount = coupon.value;
    }

    // Ensure discount doesn't exceed total
    if (discount > orderTotal) {
      discount = orderTotal;
    }

    return { 
      valid: true, 
      discount, 
      coupon 
    };

  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, message: "Erro ao validar cupom." };
  }
}

export async function incrementCouponUsage(id: string) {
  try {
    await prisma.coupon.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
    return { success: true };
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return { success: false };
  }
}
