"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { OrderItem, PaymentMethod } from "@/lib/types";
import { incrementCouponUsage } from "./coupons";

interface CreateOrderData {
  companyId: string;
  customerName: string;
  customerPhone: string;
  customerCpf?: string;
  deliveryAddress?: any;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  userId?: string;
  couponId?: string;
  discount?: number;
  scheduledPickupTime?: Date;
}

function generateOrderId(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return result;
}

export async function createOrder(data: CreateOrderData) {
  try {
    const {
      companyId,
      customerName,
      customerPhone,
      customerCpf,
      deliveryAddress,
      items,
      total,
      paymentMethod,
      notes,
      couponId,
      discount,
      scheduledPickupTime,
    } = data;

    let userId = data.userId;

    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return { success: false, error: "Company not found" };
    }

    // Validate user if provided
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        // If user not found (e.g. stale session), treat as guest order
        console.warn(`User ${userId} not found, proceeding as guest order`);
        userId = undefined;
      }
    }

    if (!company.isOpen) {
      return {
        success: false,
        error: "O restaurante está fechado no momento.",
      };
    }

    // Create order with custom ID
    let orderId = generateOrderId();
    let order;
    let retries = 0;

    while (retries < 3) {
      try {
        order = await prisma.order.create({
          data: {
            id: orderId,
            companyId,
            customerName,
            customerPhone,
            customerCpf: customerCpf || null,
            deliveryAddress: deliveryAddress || null,
            items: items as any, // Prisma handles JSON
            total,
            status: "pending",
            paymentMethod,
            notes: notes || "",
            userId: userId || null,
            couponId: couponId || null,
            discount: discount || 0,
            scheduledPickupTime,
          },
        });
        break;
      } catch (e: any) {
        // P2002 is Unique constraint failed
        if (e.code === "P2002") {
          orderId = generateOrderId();
          retries++;
          continue;
        }
        throw e;
      }
    }

    if (!order) {
      return { success: false, error: "Failed to generate unique Order ID" };
    }

    // Increment coupon usage if coupon was used
    if (couponId) {
      await incrementCouponUsage(couponId);
    }

    revalidatePath("/empresa/dashboard/pedidos");
    revalidatePath(`/loja/${company.slug}`);
    revalidatePath("/historico");

    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message || "Failed to create order" };
  }
}

export async function getOrders(companyId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function getCustomerOrders(userId: string) {
  try {
    console.log("Fetching orders for userId:", userId);
    const orders = await prisma.order.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      include: { company: true },
    });
    console.log("Found orders count:", orders.length);
    return orders;
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
}

export async function updateOrderStatus(
  orderId: string,
  companyId: string,
  newStatus: any, // Using any to avoid import issues if OrderStatus isn't exported, but it should be
) {
  try {
    // Verify order belongs to company
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.companyId !== companyId) {
      return { success: false, error: "Order not found or access denied" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    revalidatePath("/empresa/dashboard");
    revalidatePath("/empresa/dashboard/pedidos");

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}
