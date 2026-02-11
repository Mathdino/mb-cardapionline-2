"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCompany(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string; // Em produção, usar hash!

  try {
    const company = await prisma.company.create({
      data: {
        name,
        slug,
        description: `Restaurante ${name}`,
        profileImage: "/placeholder-logo.png",
        bannerImage: "/placeholder.jpg",
        phone: [],
        whatsapp: "",
        minimumOrder: 0,
        address: {},
        businessHours: {},
        paymentMethods: [],
        users: {
          create: {
            email,
            password, // TODO: Hash password
            name: `Admin ${name}`,
            role: "company_owner",
          },
        },
      },
    });

    revalidatePath("/admin");
    return { success: true, company };
  } catch (error) {
    console.error("Failed to create company:", error);
    return { success: false, error: "Failed to create company" };
  }
}

export async function resetPassword(userId: string, newPassword: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword }, // Em produção, usar hash!
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

export async function getCompanies() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        users: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return companies;
  } catch (error) {
    console.error("Failed to get companies:", error);
    return [];
  }
}
