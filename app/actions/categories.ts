"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories(companyId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: { companyId },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategory(
  companyId: string,
  name: string,
  order: number,
) {
  try {
    const category = await prisma.category.create({
      data: {
        companyId,
        name,
        order,
      },
    });
    revalidatePath("/empresa/dashboard/categorias");
    return { success: true, category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(
  id: string,
  companyId: string,
  name: string,
  order: number,
) {
  try {
    // Verify ownership
    const existing = await prisma.category.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Category not found or access denied" };
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, order },
    });

    revalidatePath("/empresa/dashboard/categorias");
    return { success: true, category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string, companyId: string) {
  try {
    // Verify ownership
    const existing = await prisma.category.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return { success: false, error: "Category not found or access denied" };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/empresa/dashboard/categorias");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
