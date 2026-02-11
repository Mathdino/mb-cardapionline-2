import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string | null;
      cpf?: string | null;
      address?: any | null;
    };
  }

  interface User {
    id: string;
    role: string;
    phone?: string | null;
    cpf?: string | null;
    address?: any | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    phone?: string | null;
    cpf?: string | null;
    address?: any | null;
  }
}
