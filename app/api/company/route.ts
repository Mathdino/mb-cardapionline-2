import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("=== API UPDATE COMPANY START ===");

    // Busca a primeira empresa disponível no banco
    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Empresa não encontrada no banco." },
        { status: 404 }
      );
    }

    const cleanData: any = {};
    if (data.name) cleanData.name = data.name;
    if (data.description) cleanData.description = data.description;
    if (data.whatsapp) cleanData.whatsapp = data.whatsapp;
    if (data.minimumOrder !== undefined) cleanData.minimumOrder = Number(data.minimumOrder);
    if (data.allowsDelivery !== undefined) cleanData.allowsDelivery = Boolean(data.allowsDelivery);
    if (data.allowsPickup !== undefined) cleanData.allowsPickup = Boolean(data.allowsPickup);
    if (data.profileImage) cleanData.profileImage = data.profileImage;
    if (data.bannerImage) cleanData.bannerImage = data.bannerImage;
    if (data.phone) cleanData.phone = data.phone;
    if (data.address) cleanData.address = data.address;
    if (data.businessHours) cleanData.businessHours = data.businessHours;
    if (data.paymentMethods) cleanData.paymentMethods = data.paymentMethods;
    if (data.isOpen !== undefined) cleanData.isOpen = data.isOpen;

    console.log("Data to update in API:", JSON.stringify(cleanData, null, 2));

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: cleanData
    });

    console.log("API Update success!");
    revalidatePath("/empresa/dashboard/informacoes");
    revalidateTag("companies");
    revalidateTag(`company:${updated.slug}`);
    
    return NextResponse.json({ 
      success: true, 
      company: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug
      } 
    });
  } catch (error: any) {
    console.error("=== API UPDATE COMPANY ERROR ===");
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao atualizar" },
      { status: 500 }
    );
  }
}
