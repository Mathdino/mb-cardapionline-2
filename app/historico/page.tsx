import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomerOrders } from "@/app/actions/order";
import { OrderHistoryList } from "@/components/client/order-history-list";
import { Metadata } from "next";
import { ScrollHeader } from "@/components/client/scroll-header";
import { getCompanies } from "@/app/actions/company";

export const metadata: Metadata = {
  title: "Histórico de Compras",
  description: "Seus pedidos anteriores",
};

export default async function OrderHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/entrar");
  }

  const [orders, companies] = await Promise.all([
    getCustomerOrders(session.user.id),
    getCompanies(),
  ]);

  const company = companies[0];

  return (
    <div className="container mx-auto py-10 px-4 pt-20">
      <ScrollHeader company={company} alwaysVisible />
      <h1 className="text-2xl font-bold mb-6">Histórico de Compras</h1>
      <OrderHistoryList orders={orders} />
    </div>
  );
}
