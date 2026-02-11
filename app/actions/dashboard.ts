"use server";

import prisma from "@/lib/prisma";

export interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  recentOrders: any[];
}

export async function getDashboardStats(
  companyId: string,
): Promise<DashboardStats | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrdersCount,
      pendingOrdersCount,
      todayRevenue,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      // Orders today
      prisma.order.count({
        where: {
          companyId,
          createdAt: {
            gte: today,
          },
        },
      }),
      // Pending orders
      prisma.order.count({
        where: {
          companyId,
          status: "pending",
        },
      }),
      // Revenue today
      prisma.order.aggregate({
        where: {
          companyId,
          createdAt: {
            gte: today,
          },
          status: {
            not: "cancelled",
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Total revenue
      prisma.order.aggregate({
        where: {
          companyId,
          status: {
            not: "cancelled",
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Recent orders
      prisma.order.findMany({
        where: {
          companyId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    return {
      todayOrders: todayOrdersCount,
      pendingOrders: pendingOrdersCount,
      todayRevenue: todayRevenue._sum.total || 0,
      totalRevenue: totalRevenue._sum.total || 0,
      recentOrders,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}
