import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "CPF",
      credentials: {
        cpf: { label: "CPF", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.cpf || !credentials?.password) {
          throw new Error("Credenciais inválidas");
        }

        // Clean CPF (remove non-digits)
        const cleanCpf = credentials.cpf.replace(/\D/g, "");

        const user = await prisma.user.findUnique({
          where: { cpf: cleanCpf },
        });

        if (!user || !user.password) {
          throw new Error("Usuário não encontrado");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          throw new Error("Senha incorreta");
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user && token.sub) {
        session.user.id = token.sub;

        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.sub },
          });

          if (freshUser) {
            session.user.role = freshUser.role;
            session.user.phone = freshUser.phone;
            session.user.cpf = freshUser.cpf;
            session.user.address = freshUser.address;
            session.user.name = freshUser.name;
          } else {
            // Fallback to token if user not found (shouldn't happen usually)
            session.user.role = token.role as string;
            session.user.phone = token.phone as string | null;
            session.user.cpf = token.cpf as string | null;
            session.user.address = token.address;
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error);
          // Fallback to token on error
          session.user.role = token.role as string;
          session.user.phone = token.phone as string | null;
          session.user.cpf = token.cpf as string | null;
          session.user.address = token.address;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone;
        token.cpf = user.cpf;
        token.address = user.address;
      }
      return token;
    },
  },
  pages: {
    signIn: "/entrar",
  },
};
