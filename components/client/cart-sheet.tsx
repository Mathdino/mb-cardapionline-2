"use client";

import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  X,
  MessageCircle,
  Loader2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  TicketPercent,
  User,
  Phone,
  FileText,
  MapPin,
  Truck,
  Store,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import {
  formatCurrency,
  paymentMethodLabels,
  formatPhone,
  formatCPF,
  formatCEP,
} from "@/lib/utils";
import type { Company, PaymentMethod } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createOrder } from "@/app/actions/order";
import { OrderItem } from "@/lib/types";
import { useSession } from "next-auth/react";

interface CartSheetProps {
  company: Company;
}

export function CartSheet({ company }: CartSheetProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    cep: "",
  });
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    company.allowsDelivery ? "delivery" : "pickup",
  );
  const [scheduledPickupTime, setScheduledPickupTime] = useState<Date | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const { data: session } = useSession();
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const sectionTitle = "text-[18px] font-extrabold font-serif";

  const {
    items,
    total,
    subtotal,
    discount,
    coupon,
    itemCount,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    getWhatsAppMessage,
  } = useCart();
  const promoDiscount = useMemo(() => {
    let d = 0;
    items.forEach((item) => {
      const hasPromotion =
        item.product.isPromotion &&
        item.product.promotionalPrice !== null &&
        item.product.promotionalPrice !== undefined &&
        item.product.promotionalPrice > 0;
      if (hasPromotion) {
        const diff = item.product.price - item.product.promotionalPrice!;
        if (diff > 0) d += diff * item.quantity;
      }
    });
    return d;
  }, [items]);

  const availableSlots = useMemo(() => {
    if (items.length === 0) return [];

    let totalPrepMinutes = 0;
    items.forEach((item) => {
      const prepTime = item.product.preparationTime || 0;
      const unit = item.product.preparationTimeUnit || "hours";
      if (unit === "hours") {
        totalPrepMinutes += prepTime * 60;
      } else {
        totalPrepMinutes += prepTime * 24 * 60;
      }
    });

    const slots: Date[] = [];
    const now = new Date();
    const minTime = new Date(now.getTime() + totalPrepMinutes * 60000);

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dayOfWeek = date.getDay();
      const businessHour = company.businessHours.find(
        (bh) => bh.dayOfWeek === dayOfWeek,
      );

      if (!businessHour || !businessHour.isOpen) continue;

      const [openH, openM] = businessHour.openTime.split(":").map(Number);
      const [closeH, closeM] = businessHour.closeTime.split(":").map(Number);

      const startTime = new Date(date);
      startTime.setHours(openH, openM, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(closeH, closeM, 0, 0);

      let currentSlot = new Date(startTime);
      while (currentSlot <= endTime) {
        if (currentSlot >= minTime) {
          slots.push(new Date(currentSlot));
        }
        currentSlot.setMinutes(currentSlot.getMinutes() + 30);
      }
    }

    return slots;
  }, [items, company.businessHours]);

  const groupedSlots = useMemo(() => {
    const groups: { [key: string]: Date[] } = {};
    availableSlots.forEach((slot) => {
      const dateStr = slot.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(slot);
    });
    return groups;
  }, [availableSlots]);

  useEffect(() => {
    if (availableSlots.length > 0 && !selectedDay) {
      const firstDateStr = availableSlots[0].toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });
      setSelectedDay(firstDateStr);
    }
  }, [availableSlots, selectedDay]);

  useEffect(() => {
    if (!session?.user) {
      if (hasPrefilled) setHasPrefilled(false);
      return;
    }

    if (showCheckout && !hasPrefilled) {
      console.log("Prefilling user data from session:", session.user);
      if (session.user.name && !customerName) {
        setCustomerName(session.user.name);
      }
      if (session.user.phone && !customerPhone) {
        setCustomerPhone(formatPhone(session.user.phone));
      }
      if (session.user.cpf && !customerCpf) {
        setCustomerCpf(formatCPF(session.user.cpf));
      }
      if (session.user.address) {
        const addr = session.user.address;
        setDeliveryAddress((prev) => ({
          street: addr.street || prev.street,
          number: addr.number || prev.number,
          complement: addr.complement || prev.complement,
          neighborhood: addr.neighborhood || prev.neighborhood,
          city: addr.city || prev.city,
          state: addr.state || prev.state,
          cep: addr.cep || prev.cep,
        }));
      }
      setHasPrefilled(true);
    }
  }, [
    session,
    showCheckout,
    hasPrefilled,
    customerName,
    customerPhone,
    customerCpf,
  ]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const result = await applyCoupon(couponCode, company.id);
      if (!result.success) {
        alert(result.message || "Erro ao aplicar cupom");
      } else {
        setCouponCode("");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao validar cupom");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (!company.isOpen) {
      alert("O restaurante está fechado no momento.");
      return;
    }

    if (!customerName.trim()) {
      alert("Por favor, informe seu nome");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Por favor, informe seu telefone");
      return;
    }

    if (
      deliveryType === "delivery" &&
      (!deliveryAddress.street || !deliveryAddress.number)
    ) {
      alert("Por favor, informe o endereço de entrega (Rua e Número).");
      return;
    }

    if (total < company.minimumOrder) {
      alert(`O pedido mínimo é ${formatCurrency(company.minimumOrder)}`);
      return;
    }

    if (!scheduledPickupTime) {
      alert(
        `Por favor, selecione um horário para ${deliveryType === "delivery" ? "entrega" : "retirada"}.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Creating order for user:", session?.user?.id);
      // Create order items
      const orderItems: OrderItem[] = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.subtotal / item.quantity,
        subtotal: item.subtotal,
        selectedFlavor: item.selectedFlavor?.name,
        selectedFlavors: item.selectedFlavors?.map((f) => f.name),
        comboItems: item.selectedComboItems?.map(
          (ci) => `${ci.quantity}x ${ci.name}`,
        ),
        selectedComplements: item.selectedComplements,
        removedIngredients: item.removedIngredients,
      }));

      // Create order in database
      const orderData = {
        companyId: company.id,
        customerName,
        customerPhone,
        customerCpf,
        deliveryAddress,
        items: orderItems,
        total,
        paymentMethod,
        notes,
        userId: session?.user?.id,
        couponId: coupon?.id,
        discount,
        scheduledPickupTime: scheduledPickupTime || undefined,
      };
      console.log("Order Data Payload:", orderData);

      const result = await createOrder(orderData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      // Open WhatsApp
      let message = `*Novo Pedido* - ${company.name}\n\n`;
      message += `*Cliente:* ${customerName}\n`;
      message += `*Telefone:* ${customerPhone}\n`;
      if (customerCpf) message += `*CPF:* ${customerCpf}\n`;

      if (deliveryType === "delivery") {
        message += `*Endereço:* ${deliveryAddress.street}, ${deliveryAddress.number}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ""} - ${deliveryAddress.neighborhood}\n\n`;
      } else {
        message += `*Tipo:* Retirada no Local\n\n`;
      }

      message += `*Itens:*\n`;
      orderItems.forEach((item) => {
        message += `${item.quantity}x ${item.productName}`;
        if (item.selectedFlavor) message += ` (${item.selectedFlavor})`;
        if (item.selectedFlavors)
          message += ` (${item.selectedFlavors.join(", ")})`;
        message += ` - ${formatCurrency(item.subtotal)}\n`;
        if (item.comboItems && item.comboItems.length > 0) {
          item.comboItems.forEach((ci) => (message += `  - ${ci}\n`));
        }
        if (item.selectedComplements && item.selectedComplements.length > 0) {
          item.selectedComplements.forEach(
            (comp) => (message += `  - + ${comp.quantity}x ${comp.name}\n`),
          );
        }
        if (item.removedIngredients && item.removedIngredients.length > 0) {
          message += `  - Sem: ${item.removedIngredients.join(", ")}\n`;
        }
      });

      if (coupon) {
        message += `\n*Cupom:* ${coupon.code}`;
        message += `\n*Desconto:* -${formatCurrency(discount)}`;
      }

      message += `\n*Total:* ${formatCurrency(total)}\n`;
      message += `*Pagamento:* ${paymentMethodLabels[paymentMethod]}\n`;
      if (scheduledPickupTime) {
        const typeLabel = deliveryType === "delivery" ? "Entrega" : "Retirada";
        message += `*${typeLabel} Agendada:* ${scheduledPickupTime.toLocaleDateString("pt-BR")} às ${scheduledPickupTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}\n`;
      }
      if (notes) message += `*Obs:* ${notes}\n`;

      const digits = (
        company.whatsapp ||
        (Array.isArray(company.phone) ? company.phone[0] : "") ||
        ""
      ).replace(/\D/g, "");
      if (!digits) {
        alert("WhatsApp da empresa não está configurado.");
      } else {
        const whatsappUrl = `https://wa.me/${digits}?text=${encodeURIComponent(
          message,
        )}`;
        window.open(whatsappUrl, "_blank");
      }

      if (session?.user) {
        router.push("/historico");
      }

      clearCart();
      setIsOpen(false);
      setShowCheckout(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerCpf("");
      setDeliveryAddress({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        cep: "",
      });
      setNotes("");
    } catch (error) {
      console.error("Error processing order:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao processar pedido. Por favor, tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Cart Button */}
      {itemCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">Ver carrinho</span>
          <span className="bg-primary-foreground text-primary px-2 py-0.5 rounded-full text-sm font-bold">
            {itemCount}
          </span>
        </button>
      )}

      {/* Cart Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setIsOpen(false);
              setShowCheckout(false);
            }}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-foreground">
                {showCheckout ? "Finalizar Pedido" : "Seu Carrinho"}
              </h2>
              <button
                onClick={() => {
                  if (showCheckout) {
                    setShowCheckout(false);
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!showCheckout ? (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={item.cartItemId}
                          className="flex gap-3 p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                            <Image
                              src={item.product.image || "/placeholder.svg"}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">
                              {item.product.name}
                            </h4>
                            {item.selectedFlavors &&
                            item.selectedFlavors.length > 0 ? (
                              <p className="text-xs text-muted-foreground">
                                {item.selectedFlavors
                                  .map((f) => f.name)
                                  .join(", ")}
                              </p>
                            ) : (
                              item.selectedFlavor && (
                                <p className="text-xs text-muted-foreground">
                                  {item.selectedFlavor.name}
                                </p>
                              )
                            )}
                            {item.removedIngredients &&
                              item.removedIngredients.length > 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                  Sem: {item.removedIngredients.join(", ")}
                                </p>
                              )}
                            {item.selectedComboItems &&
                              item.selectedComboItems.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.selectedComboItems.map(
                                    (comboItem, i) => (
                                      <p
                                        key={i}
                                        className="text-xs text-muted-foreground"
                                      >
                                        {comboItem.quantity}x {comboItem.name}
                                      </p>
                                    ),
                                  )}
                                </div>
                              )}
                            {item.selectedComplements &&
                              item.selectedComplements.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {item.selectedComplements.map((comp, i) => (
                                    <p
                                      key={i}
                                      className="text-xs text-muted-foreground"
                                    >
                                      + {comp.quantity}x {comp.name}
                                    </p>
                                  ))}
                                </div>
                              )}
                            <p className="text-sm font-semibold text-foreground mt-1">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>

                          <div className="flex flex-col items-end justify-between">
                            <button
                              onClick={() => removeItem(item.cartItemId)}
                              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId,
                                    item.quantity - 1,
                                  )
                                }
                                className="p-1 rounded bg-secondary hover:bg-secondary/80"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-5 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId,
                                    item.quantity + 1,
                                  )
                                }
                                className="p-1 rounded bg-secondary hover:bg-secondary/80"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                  <div className="p-4 border-t bg-background">
                    <div className="mb-1"></div>

                    <div className="space-y-1 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {coupon && (
                        <div className="flex items-center justify-between text-sm text-green-600">
                          <span>Desconto</span>
                          <span>- {formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <span className="text-base font-bold text-foreground">
                          Total
                        </span>
                        <span className="text-xl font-bold text-foreground">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>

                    {total < company.minimumOrder && (
                      <p className="text-sm text-destructive mb-3">
                        Pedido mínimo: {formatCurrency(company.minimumOrder)}
                      </p>
                    )}

                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        setShowCheckout(true);
                      }}
                      disabled={total < company.minimumOrder}
                      className="w-full h-12"
                    >
                      Continuar
                    </Button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            <div className="flex items-center gap-2 p-4 border-b">
              <button
                className="p-2 rounded-full hover:bg-secondary"
                onClick={() => setShowCheckout(false)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold">Finalizar compra</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className={sectionTitle}>Dados do cliente</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Seu nome"
                      className="flex-1 px-4 py-3 rounded-lg border"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(formatPhone(e.target.value))
                      }
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                      className="flex-1 px-4 py-3 rounded-lg border"
                    />
                  </div>
                </div>
              </div>
              {company.allowsDelivery && company.allowsPickup && (
                <div className="rounded-2xl border bg-card p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("delivery")}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 ${
                        deliveryType === "delivery"
                          ? "border-brand bg-brand/15 text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      <Truck className="h-5 w-5" />
                      <span className="font-bold text-sm">Entrega</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("pickup")}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 ${
                        deliveryType === "pickup"
                          ? "border-brand bg-brand/15 text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      <Store className="h-5 w-5" />
                      <span className="font-bold text-sm">Retirada</span>
                    </button>
                  </div>
                </div>
              )}
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className={sectionTitle}>Endereço de entrega</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  {deliveryType === "delivery"
                    ? "Entrega da loja"
                    : "Retirada na loja"}
                </span>
                {deliveryType === "delivery" && company.allowsDelivery && (
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {deliveryAddress.street && deliveryAddress.number
                          ? `${deliveryAddress.street}, ${deliveryAddress.number}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ""}`
                          : "Definir endereço"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {deliveryAddress.neighborhood ||
                        deliveryAddress.city ||
                        deliveryAddress.state
                          ? `${deliveryAddress.neighborhood || ""} ${deliveryAddress.city || ""} ${deliveryAddress.state || ""}`.trim()
                          : "Toque para editar"}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className={`${sectionTitle} text-foreground`}>
                    {deliveryType === "delivery"
                      ? "Horários de entrega"
                      : "Horários de retirada"}
                  </h3>
                </div>
                <div className="space-y-4">
                  {availableSlots.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                        {Object.keys(groupedSlots).map((dateStr) => (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedDay(dateStr)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] p-3 rounded-xl border-2 ${
                              selectedDay === dateStr
                                ? "border-brand bg-brand/15 text-primary"
                                : "border-muted text-muted-foreground"
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold opacity-70">
                              {dateStr.split(" ")[0].replace(".", "")}
                            </span>
                            <span className="text-lg font-bold leading-tight">
                              {dateStr.split(" ")[1]}
                            </span>
                          </button>
                        ))}
                      </div>
                      {selectedDay && groupedSlots[selectedDay] && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {groupedSlots[selectedDay].map((slot) => {
                              const isSelected =
                                scheduledPickupTime?.getTime() ===
                                slot.getTime();
                              return (
                                <button
                                  key={slot.toISOString()}
                                  type="button"
                                  onClick={() => setScheduledPickupTime(slot)}
                                  className={`py-2.5 px-2 rounded-lg border-2 text-sm font-bold ${
                                    isSelected
                                      ? "border-brand bg-brand text-primary-foreground"
                                      : "border-muted bg-background text-foreground"
                                  }`}
                                >
                                  {slot.toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">
                      Não há horários disponíveis.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={sectionTitle}>Pagamento</h3>
                  <button
                    className="text-sm text-primary"
                    onClick={() => setShowAllPayments((v) => !v)}
                  >
                    {showAllPayments ? "Ocultar" : "Ver tudo"}
                  </button>
                </div>
                {!showAllPayments ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {paymentMethodLabels[paymentMethod]}
                    </span>
                    <div className="h-5 w-5 rounded-full border-2 border-brand flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(Array.isArray(company.paymentMethods)
                      ? company.paymentMethods
                      : []
                    ).map((method) => (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method as PaymentMethod);
                          setShowAllPayments(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          paymentMethod === method
                            ? "border-brand bg-brand/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium text-foreground">
                          {paymentMethodLabels[method]}
                        </span>
                        <div
                          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === method
                              ? "border-brand"
                              : "border-muted-foreground"
                          }`}
                        >
                          {paymentMethod === method && (
                            <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className={sectionTitle}>Resumo do pedido</h3>
                {items.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-secondary">
                      <Image
                        src={items[0].product.image || "/placeholder.svg"}
                        alt={items[0].product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">
                        {items.length === 1
                          ? "1 item"
                          : `${items.length} itens`}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className={sectionTitle}>Economize hoje</h3>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(true)}
                  className="w-full flex items-center justify-between rounded-2xl bg-emerald-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500 text-white">
                      <TicketPercent className="h-5 w-5" />
                    </div>
                    <span className="text-base font-semibold text-foreground">
                      Cupons de desconto
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {coupon ? `${coupon.code}` : ""}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
                <h3 className={sectionTitle}>Detalhes das taxas</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Desconto do item</span>
                      <span>-{formatCurrency(promoDiscount)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Desconto do cupom</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Taxa de entrega
                    </span>
                    <span>Grátis</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t mt-2">
                    <span className="text-base font-bold text-foreground">
                      Total
                    </span>
                    <span className="text-xl font-bold text-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className={sectionTitle}>Informações adicionais</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border resize-none"
                />
              </div>
              <div className="rounded-2xl border bg-card p-4 space-y-3">
                <h3 className={sectionTitle}>CPF</h3>
                <input
                  type="text"
                  value={customerCpf}
                  onChange={(e) => setCustomerCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-4 py-3 rounded-lg border"
                />
              </div>
              <div className="px-1 text-xs text-muted-foreground">
                Este pedido é entregue pela loja. Ao tocar no botão de
                pagamento, você concorda em fornecer seu nome, endereço e número
                de telefone à loja para entrega.
              </div>
            </div>
            <div className="p-4 border-t bg-background">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xl font-bold">
                    {formatCurrency(total)}
                  </div>
                  <div className="text-xs text-green-600">
                    {promoDiscount + discount > 0
                      ? `Economizou ${formatCurrency(promoDiscount + discount)}`
                      : ""}
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={
                    !customerName.trim() ||
                    !customerPhone.trim() ||
                    isSubmitting
                  }
                  className="h-12 px-6 rounded-lg bg-brand text-black font-bold"
                >
                  {isSubmitting ? "Processando..." : "Pedir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Endereço de entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="text"
              value={deliveryAddress.cep}
              onChange={(e) => {
                const newCep = formatCEP(e.target.value);
                setDeliveryAddress({ ...deliveryAddress, cep: newCep });
              }}
              placeholder="CEP"
              maxLength={9}
              className="w-full px-4 py-3 rounded-lg border"
            />
            <input
              type="text"
              value={deliveryAddress.street}
              onChange={(e) =>
                setDeliveryAddress({
                  ...deliveryAddress,
                  street: e.target.value,
                })
              }
              placeholder="Rua"
              className="w-full px-4 py-3 rounded-lg border"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={deliveryAddress.number}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    number: e.target.value,
                  })
                }
                placeholder="Número"
                className="px-4 py-3 rounded-lg border"
              />
              <input
                type="text"
                value={deliveryAddress.neighborhood}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    neighborhood: e.target.value,
                  })
                }
                placeholder="Bairro"
                className="px-4 py-3 rounded-lg border"
              />
            </div>
            <input
              type="text"
              value={deliveryAddress.complement}
              onChange={(e) =>
                setDeliveryAddress({
                  ...deliveryAddress,
                  complement: e.target.value,
                })
              }
              placeholder="Complemento (apto, bloco, referência)"
              className="w-full px-4 py-3 rounded-lg border"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={deliveryAddress.city}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    city: e.target.value,
                  })
                }
                placeholder="Cidade"
                className="px-4 py-3 rounded-lg border"
              />
              <input
                type="text"
                value={deliveryAddress.state}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    state: e.target.value,
                  })
                }
                placeholder="UF"
                className="px-4 py-3 rounded-lg border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddressModal(false)}
            >
              Fechar
            </Button>
            <Button onClick={() => setShowAddressModal(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cupons de desconto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {coupon ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500 text-white">
                    <TicketPercent className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Cupom aplicado
                    </p>
                    <p className="font-bold">{coupon.code}</p>
                  </div>
                </div>
                <Button variant="destructive" onClick={removeCoupon} size="sm">
                  Remover
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código do cupom"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background uppercase"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || isApplyingCoupon}
                  >
                    {isApplyingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dica: os cupons não são cumulativos.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCouponModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
