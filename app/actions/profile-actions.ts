
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  name: string;
  phone: string;
  cpf: string;
  address: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { error: "Não autorizado" };
    }

    // Clean phone and cpf
    const cleanPhone = data.phone.replace(/\D/g, "");
    const cleanCpf = data.cpf.replace(/\D/g, "");

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        phone: cleanPhone,
        cpf: cleanCpf,
        address: data.address,
      },
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return { error: "Erro ao atualizar perfil. Tente novamente." };
  }
}
