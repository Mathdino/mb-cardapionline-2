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
        setCustomerPhone(session.user.phone);
      }
      if (session.user.cpf && !customerCpf) {
        setCustomerCpf(session.user.cpf);
      }
      if (session.user.address) {
        const addr = session.user.address;
        setDeliveryAddress((prev) => ({
          street: addr.street || prev.street,
          number: addr.number || prev.number,
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
        message += `*Endereço:* ${deliveryAddress.street}, ${deliveryAddress.number} - ${deliveryAddress.neighborhood}\n\n`;
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

      const whatsappUrl = `https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, "_blank");

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
                    {/* Coupon Section */}
                    <div className="mb-4">
                      {coupon ? (
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">
                              Cupom aplicado
                            </span>
                            <span className="font-bold text-green-700 dark:text-green-400">
                              {coupon.code}
                            </span>
                          </div>
                          <button
                            onClick={removeCoupon}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
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
                            variant="outline"
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
                      )}
                    </div>

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
                      onClick={() => setShowCheckout(true)}
                      disabled={total < company.minimumOrder}
                      className="w-full h-12"
                    >
                      Continuar
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Checkout Form */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Seu nome
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Digite seu nome"
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Seu telefone
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(formatPhone(e.target.value))
                      }
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Customer CPF */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      CPF
                    </label>
                    <input
                      type="text"
                      value={customerCpf}
                      onChange={(e) =>
                        setCustomerCpf(formatCPF(e.target.value))
                      }
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Delivery Type Selection (Only if both are allowed) */}
                  {company.allowsDelivery && company.allowsPickup && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType("delivery")}
                        className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          deliveryType === "delivery"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-muted bg-transparent text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        <Truck className="h-5 w-5" />
                        <span className="font-bold text-sm">Entrega</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType("pickup")}
                        className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          deliveryType === "pickup"
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-muted bg-transparent text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        <Store className="h-5 w-5" />
                        <span className="font-bold text-sm">Retirada</span>
                      </button>
                    </div>
                  )}

                  {/* Delivery Address */}
                  {deliveryType === "delivery" && company.allowsDelivery && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">
                          Endereço de Entrega
                        </h3>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            CEP
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress.cep}
                            onChange={(e) => {
                              const newCep = formatCEP(e.target.value);
                              setDeliveryAddress({
                                ...deliveryAddress,
                                cep: newCep,
                              });
                              if (newCep.length === 9) {
                                fetch(
                                  `https://viacep.com.br/ws/${newCep.replace(/\D/g, "")}/json/`,
                                )
                                  .then((res) => res.json())
                                  .then((data) => {
                                    if (!data.erro) {
                                      setDeliveryAddress((prev) => ({
                                        ...prev,
                                        street: data.logradouro,
                                        neighborhood: data.bairro,
                                        city: data.localidade,
                                        state: data.uf,
                                        cep: newCep,
                                      }));
                                    }
                                  })
                                  .catch(() => {});
                              }
                            }}
                            placeholder="00000-000"
                            maxLength={9}
                            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Rua
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress.street}
                          onChange={(e) =>
                            setDeliveryAddress({
                              ...deliveryAddress,
                              street: e.target.value,
                            })
                          }
                          placeholder="Nome da rua"
                          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Bairro
                          </label>
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
                            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Nº
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress.number}
                            onChange={(e) =>
                              setDeliveryAddress({
                                ...deliveryAddress,
                                number: e.target.value,
                              })
                            }
                            placeholder="123"
                            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Cidade
                          </label>
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
                            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            UF
                          </label>
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
                            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Pickup Time */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        {deliveryType === "delivery"
                          ? "Agendamento de Entrega"
                          : "Agendamento de Retirada"}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {availableSlots.length > 0 ? (
                        <div className="space-y-6">
                          {/* Day Selector */}
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                            {Object.keys(groupedSlots).map((dateStr) => (
                              <button
                                key={dateStr}
                                type="button"
                                onClick={() => setSelectedDay(dateStr)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] p-3 rounded-xl border-2 transition-all ${
                                  selectedDay === dateStr
                                    ? "border-brand bg-brand/15 text-primary shadow-sm"
                                    : "border-muted bg-muted/20 text-muted-foreground hover:border-muted-foreground/30"
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

                          {/* Time Slots Grid */}
                          {selectedDay && groupedSlots[selectedDay] && (
                            <div className="space-y-3">
                              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Horários para {selectedDay}
                              </label>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {groupedSlots[selectedDay].map((slot) => {
                                  const isSelected =
                                    scheduledPickupTime?.getTime() ===
                                    slot.getTime();
                                  return (
                                    <button
                                      key={slot.toISOString()}
                                      type="button"
                                      onClick={() =>
                                        setScheduledPickupTime(slot)
                                      }
                                      className={`py-2.5 px-2 rounded-lg border-2 text-sm font-bold transition-all ${
                                        isSelected
                                          ? "border-brand bg-brand text-primary-foreground shadow-md scale-[1.02]"
                                          : "border-muted bg-background text-foreground hover:border-primary/40"
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
                          Não há horários de{" "}
                          {deliveryType === "delivery" ? "entrega" : "retirada"}{" "}
                          disponíveis para os itens selecionados.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Observações
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Tirar a cebola, troco para 50..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Forma de pagamento
                    </label>
                    <div className="space-y-2">
                      {company.paymentMethods.map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
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
                  </div>

                  {/* Order Summary */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-foreground mb-3">
                      Resumo do pedido
                    </h3>
                    <div className="space-y-2 text-sm">
                      {items.map((item, index) => (
                        <div
                          key={item.cartItemId}
                          className="flex flex-col text-muted-foreground"
                        >
                          <div className="flex justify-between">
                            <span>
                              {item.quantity}x {item.product.name}
                            </span>
                            <span>{formatCurrency(item.subtotal)}</span>
                          </div>
                          {item.selectedFlavors &&
                          item.selectedFlavors.length > 0 ? (
                            <span className="text-xs pl-4">
                              +{" "}
                              {item.selectedFlavors
                                .map((f) => f.name)
                                .join(", ")}
                            </span>
                          ) : (
                            item.selectedFlavor && (
                              <span className="text-xs pl-4">
                                + {item.selectedFlavor.name}
                              </span>
                            )
                          )}
                          {item.removedIngredients &&
                            item.removedIngredients.length > 0 && (
                              <span className="text-xs pl-4 text-red-500">
                                Sem: {item.removedIngredients.join(", ")}
                              </span>
                            )}
                          {item.selectedComboItems &&
                            item.selectedComboItems.map((comboItem, i) => (
                              <span key={i} className="text-xs pl-4">
                                - {comboItem.quantity}x {comboItem.name}
                              </span>
                            ))}
                          {item.selectedComplements &&
                            item.selectedComplements.map((comp, i) => (
                              <span key={i} className="text-xs pl-4">
                                + {comp.quantity}x {comp.name}
                              </span>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Checkout Footer */}
                <div className="p-4 border-t bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={
                      !customerName.trim() ||
                      !customerPhone.trim() ||
                      isSubmitting
                    }
                    className="w-full h-12 gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-5 w-5" />
                        Enviar pedido via WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
