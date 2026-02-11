import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ProfileForm } from "@/components/client/profile-form";
import { Metadata } from "next";
import { ScrollHeader } from "@/components/client/scroll-header";
import { getCompanies } from "@/app/actions/company";

export const metadata: Metadata = {
  title: "Meu Perfil",
  description: "Gerencie suas informações",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/entrar");
  }

  const [user, companies] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
    }),
    getCompanies(),
  ]);

  if (!user) {
    redirect("/entrar");
  }

  const company = companies[0];

  return (
    <div className="container mx-auto py-10 px-4 pt-20">
      <ScrollHeader company={company} alwaysVisible />
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
      <ProfileForm user={user} />
    </div>
  );
}
