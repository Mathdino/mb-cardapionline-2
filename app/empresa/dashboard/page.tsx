"use client";

import React, { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import Image from "next/image";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/app/actions/dashboard";
import {
  formatCurrency,
  orderStatusLabels,
  orderStatusColors,
  cn,
} from "@/lib/utils";
import { Package, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { OrderStatus } from "@/lib/types";
import { FoodLoading } from "@/components/ui/food-loading";

export default function DashboardPage() {
  const { getCompany } = useAuth();
  const company = getCompany();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (company?.id) {
        const data = await getDashboardStats(company.id);
        setStats(data);
      }
      setLoading(false);
    }
    loadStats();
  }, [company]);

  if (!company) return null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FoodLoading logoSrc={company?.profileImage} />
      </div>
    );
  }

  if (!stats) {
    return <div className="p-4">Erro ao carregar dados.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bem-vindo, {company.name}!
        </h1>
        <p className="text-muted-foreground mt-1">Veja o resumo da sua loja</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.todayOrders}
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
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.pendingOrders}
              </p>
            </div>
          </div>
        </div>

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
              <p className="text-sm text-muted-foreground">Receita Hoje</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.todayRevenue)}
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
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-foreground">Pedidos Recentes</h2>
          <Link
            href="/empresa/dashboard/pedidos"
            className="text-sm text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>

        <div className="divide-y">
          {stats.recentOrders.map((order: any) => (
            <div
              key={order.id}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  #{order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-sm text-foreground mt-1">
                  {formatCurrency(order.total)}
                </p>
              </div>
              <div
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  orderStatusColors[order.status as OrderStatus],
                )}
              >
                {orderStatusLabels[order.status as OrderStatus]}
              </div>
            </div>
          ))}
          {stats.recentOrders.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum pedido recente
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/empresa/dashboard/produtos"
          className="p-4 bg-card border rounded-xl hover:bg-secondary/50 transition-colors text-center"
        >
          <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="font-medium text-foreground">Produtos</p>
        </Link>

        <Link
          href="/empresa/dashboard/categorias"
          className="p-4 bg-card border rounded-xl hover:bg-secondary/50 transition-colors text-center"
        >
          <svg
            className="h-6 w-6 mx-auto mb-2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          <p className="font-medium text-foreground">Categorias</p>
        </Link>

        <Link
          href="/empresa/dashboard/promocoes"
          className="p-4 bg-card border rounded-xl hover:bg-secondary/50 transition-colors text-center"
        >
          <Tag className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="font-medium text-foreground">Promoções e Combos</p>
        </Link>

        <Link
          href="/empresa/dashboard/informacoes"
          className="p-4 bg-card border rounded-xl hover:bg-secondary/50 transition-colors text-center"
        >
          <Building2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="font-medium text-foreground">Informações</p>
        </Link>
      </div>
    </div>
  );
}

function Tag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}

function Building2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}
