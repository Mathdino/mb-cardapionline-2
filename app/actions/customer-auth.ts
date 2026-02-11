"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerCustomer(data: {
  name: string;
  cpf: string;
  password: string;
}) {
  try {
    const { name, cpf, password } = data;

    if (!name || !cpf || !password) {
      return { error: "Todos os campos são obrigatórios" };
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    const existingUser = await prisma.user.findUnique({
      where: { cpf: cleanCpf },
    });

    if (existingUser) {
      return { error: "CPF já cadastrado" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        cpf: cleanCpf,
        password: hashedPassword,
        role: "customer",
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Erro ao registrar cliente:", error);
    return { error: "Erro ao criar conta. Tente novamente." };
  }
}
