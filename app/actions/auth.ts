"use server";

import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export async function authenticateUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
      },
    });

    if (!user || !user.password) {
      return { success: false, error: "User not found" };
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      return { success: false, error: "Invalid password" };
    }

    const mappedUser = {
      ...user,
      role: user.role === "company_owner" ? "company" : user.role,
    };

    return {
      success: true,
      user: mappedUser,
      company: user.company,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Authentication failed" };
  }
}
