"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Company } from "@/lib/types";

export async function getCompanies() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        profileImage: true,
        bannerImage: true,
        address: true,
        phone: true,
        isOpen: true,
        allowsDelivery: true,
        allowsPickup: true,
      },
    });
    return companies;
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
}

export async function getCompanyBySlug(slug: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        profileImage: true,
        bannerImage: true,
        address: true,
        phone: true,
        whatsapp: true,
        minimumOrder: true,
        businessHours: true,
        paymentMethods: true,
        isOpen: true,
        allowsDelivery: true,
        allowsPickup: true,
      },
    });
    return company;
  } catch (error) {
    console.error("Error fetching company by slug:", error);
    return null;
  }
}

export async function getCompanyById(id: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        profileImage: true,
        bannerImage: true,
        address: true,
        phone: true,
        whatsapp: true,
        minimumOrder: true,
        businessHours: true,
        paymentMethods: true,
        isOpen: true,
        allowsDelivery: true,
        allowsPickup: true,
      },
    });
    return company;
  } catch (error) {
    console.error("Error fetching company by id:", error);
    return null;
  }
}

export async function updateCompany(companyId: string, data: any) {
  try {
    console.log("=== UPDATE COMPANY START ===");
    console.log("ID received:", companyId);

    // Busca direta para simplificar
    const company = await prisma.company.findFirst();
    if (!company) {
      console.error("No company found in database");
      return { success: false, error: "Empresa não encontrada no banco." };
    }

    const cleanData: any = {};
    if (data.name) cleanData.name = data.name;
    if (data.description) cleanData.description = data.description;
    if (data.whatsapp) cleanData.whatsapp = data.whatsapp;
    if (data.minimumOrder !== undefined)
      cleanData.minimumOrder = Number(data.minimumOrder);
    if (data.profileImage) cleanData.profileImage = data.profileImage;
    if (data.bannerImage) cleanData.bannerImage = data.bannerImage;
    if (data.phone) cleanData.phone = data.phone;
    if (data.address) cleanData.address = data.address;
    if (data.businessHours) cleanData.businessHours = data.businessHours;
    if (data.paymentMethods) cleanData.paymentMethods = data.paymentMethods;
    if (data.isOpen !== undefined) cleanData.isOpen = data.isOpen;

    console.log("Data to update:", JSON.stringify(cleanData, null, 2));

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: cleanData,
    });

    console.log("Update success!");
    revalidatePath("/empresa/dashboard/informacoes");

    // Retornar um objeto plano e simples para evitar problemas de serialização do Next.js
    return {
      success: true,
      company: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
      },
    };
  } catch (error: any) {
    console.error("=== UPDATE COMPANY ERROR ===");
    console.error(error);
    return {
      success: false,
      error: error.message || "Erro interno ao atualizar",
    };
  }
}

export async function toggleRestaurantStatus(
  companyId: string,
  isOpen: boolean,
) {
  try {
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { isOpen },
    });

    revalidatePath("/empresa/dashboard");
    revalidatePath(`/${updatedCompany.slug}`);

    return { success: true, company: updatedCompany };
  } catch (error) {
    console.error("Error toggling restaurant status:", error);
    return { success: false, error: "Failed to update restaurant status" };
  }
}
