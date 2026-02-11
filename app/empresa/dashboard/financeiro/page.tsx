"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";
import {
  formatCurrency,
  orderStatusLabels,
  orderStatusColors,
} from "@/lib/mock-data";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Calendar,
  X,
  List,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { getOrders } from "@/app/actions/order";
import { Order } from "@/lib/types";
import { FoodLoading } from "@/components/ui/food-loading";

type FilterPeriod = "today" | "week" | "month" | "year" | "custom";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function FinanceiroPage() {
  const { getCompany } = useAuth();
  const company = getCompany();
  const [period, setPeriod] = useState<FilterPeriod>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function fetchOrders() {
      if (company?.id) {
        setIsLoading(true);
        try {
          const data = await getOrders(company.id);
          const parsedOrders = data.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            items: order.items as any,
          }));
          setOrders(parsedOrders);
        } catch (error) {
          console.error("Failed to fetch orders", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchOrders();
  }, [company?.id]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case "today":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0,
        );
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        if (selectedMonth) {
          const [year, month] = selectedMonth.split("-").map(Number);
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0, 23, 59, 59, 999);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          // Parse YYYY-MM-DD to local start of day
          const [startYear, startMonth, startDay] = customStartDate
            .split("-")
            .map(Number);
          startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

          // Parse YYYY-MM-DD to local end of day
          const [endYear, endMonth, endDay] = customEndDate
            .split("-")
            .map(Number);
          endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        } else {
          // If dates are not selected, show all history
          startDate = new Date(0);
        }
        break;
      default:
        startDate = new Date(0);
    }

    // Only include delivered orders for financial calculations
    return orders.filter((order) => {
      if (order.status !== "delivered") return false;

      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, period, customStartDate, customEndDate, selectedMonth]);

  if (!company) return null;

  // Calculate statistics
  const stats = useMemo(() => {
    // Since filteredOrders already only contains delivered orders
    const delivered = filteredOrders;
    const totalRevenue = delivered.reduce((sum, o) => sum + o.total, 0);
    const averageOrder =
      delivered.length > 0 ? totalRevenue / delivered.length : 0;

    // Top products
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    for (const order of delivered) {
      for (const item of order.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      }
    }

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders: filteredOrders.length,
      deliveredOrders: delivered.length,
      totalRevenue,
      averageOrder,
      topProducts,
    };
  }, [filteredOrders]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FoodLoading logoSrc={company?.profileImage} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe o desempenho da sua loja
        </p>
      </div>

      {/* Period Filter */}
      <div className="bg-card border rounded-xl p-4">
        <div className="flex items-center gap-3 max-w-full">
          <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />

          <div className="flex flex-1 gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {[
              { value: "today", label: "Hoje" },
              { value: "week", label: "Última Semana" },
              { value: "month", label: "Mensal" },
              { value: "year", label: "Este Ano" },
              { value: "custom", label: "Personalizado" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value as FilterPeriod)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  period === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {period === "month" && (
          <div className="mt-4 pt-4 border-t">
            <div className="w-full sm:w-auto">
              <label className="block text-sm text-muted-foreground mb-1">
                Selecione o Mês
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}

        {period === "custom" && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="w-full sm:w-auto">
              <label className="block text-sm text-muted-foreground mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm text-muted-foreground mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Image
                src="/images/icon-real.png"
                alt="R$"
                width={16}
                height={16}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pedidos</p>
              <p className="text-xl font-bold text-foreground">
                {stats.totalOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entregues</p>
              <p className="text-xl font-bold text-foreground">
                {stats.deliveredOrders}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(stats.averageOrder)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-card border rounded-xl flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-foreground">Produtos Mais Vendidos</h2>
        </div>

        {stats.topProducts.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nenhuma venda no período selecionado
          </p>
        ) : (
          <div className="p-4 h-[300px] md:h-[400px] w-full relative flex items-center justify-center">
            {isMobile && (
              <button
                onClick={() => setIsLegendModalOpen(true)}
                className="absolute top-2 right-2 z-10 p-2 bg-secondary rounded-full shadow-sm"
              >
                <List className="h-4 w-4 text-foreground" />
              </button>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    // Mobile: show only percentage to avoid overlap
                    if (isMobile) {
                      // Only show label if slice is significant (> 5%)
                      if (percent < 0.05) return null;
                      return `${(percent * 100).toFixed(0)}%`;
                    }
                    return `${name} ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={isMobile ? 100 : 120}
                  fill="#8884d8"
                  dataKey="quantity"
                >
                  {stats.topProducts.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                {!isMobile && (
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      paddingTop: "20px",
                      fontSize: "12px",
                    }}
                  />
                )}
                <RechartsTooltip
                  formatter={(value: number) => [value, "Qtd"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Legend Modal for Mobile */}
      {isLegendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-background rounded-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Legenda</h3>
              <button
                onClick={() => setIsLegendModalOpen(false)}
                className="p-1 hover:bg-secondary rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {stats.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.quantity} un. (
                    {((product.quantity / stats.totalOrders) * 100).toFixed(0)}
                    %)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders History */}
      <div className="bg-card border rounded-xl">
        <div className="p-4 border-b">
          <h2 className="font-bold text-foreground">Histórico de Pedidos</h2>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nenhum pedido no período selecionado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 text-sm text-foreground">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${orderStatusColors[order.status]}`}
                      >
                        {orderStatusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
