"use server";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { compare } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

    // Transform to match frontend types if needed
    // The frontend User interface expects 'role' as 'admin' | 'company'
    // The DB has 'company_owner'. Mapping it:
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
