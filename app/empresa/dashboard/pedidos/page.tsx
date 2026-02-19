"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  formatCurrency,
  orderStatusLabels,
  orderStatusColors,
  paymentMethodLabels,
} from "@/lib/mock-data";
import { formatPhone, formatCPF } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import {
  Search,
  Filter,
  X,
  Phone,
  Clock,
  MapPin,
  Store,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getOrders, updateOrderStatus } from "@/app/actions/order";
import { FoodLoading } from "@/components/ui/food-loading";

const Loading = () => null;

export default function PedidosPage() {
  const { getCompany } = useAuth();
  const company = getCompany();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousOrdersRef = useRef<Order[]>([]);
  const isFirstLoadRef = useRef(true);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/audio/notification.mp3");
      audio.play().catch((err) => console.error("Error playing sound:", err));
    } catch (error) {
      console.error("Audio initialization failed:", error);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function fetchOrders() {
      if (company?.id) {
        // Only show loading on first load
        if (isFirstLoadRef.current) setIsLoading(true);

        try {
          const data = await getOrders(company.id);
          const parsedOrders = data.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            scheduledPickupTime: order.scheduledPickupTime
              ? new Date(order.scheduledPickupTime)
              : null,
            items: order.items as any,
          }));

          // Check for new orders to play sound
          if (!isFirstLoadRef.current) {
            const previousIds = new Set(
              previousOrdersRef.current.map((o) => o.id),
            );
            const hasNewOrder = parsedOrders.some(
              (o: Order) => !previousIds.has(o.id),
            );

            if (hasNewOrder) {
              playNotificationSound();
            }
          }

          previousOrdersRef.current = parsedOrders;
          setOrders(parsedOrders);
          isFirstLoadRef.current = false;
        } catch (error) {
          console.error("Failed to fetch orders", error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchOrders();

    // Set up polling interval (every 1 minute)
    intervalId = setInterval(fetchOrders, 60000);

    return () => clearInterval(intervalId);
  }, [company?.id]);

  if (!company) return null;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FoodLoading logoSrc={company?.profileImage} />
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.includes(searchTerm);
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "delivered", label: "Entregues" },
    { value: "cancelled", label: "Cancelados" },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!selectedOrder || !company) return;

    // Optimistic update
    const previousOrder = selectedOrder;
    const previousOrders = orders;

    const updatedOrder = { ...selectedOrder, status: newStatus };
    setSelectedOrder(updatedOrder);
    setOrders(
      orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)),
    );

    const result = await updateOrderStatus(
      selectedOrder.id,
      company.id,
      newStatus,
    );

    if (result.success) {
      if (newStatus === "delivered") {
        setSelectedOrder(null);
      }
    } else {
      // Revert on failure
      setSelectedOrder(previousOrder);
      setOrders(previousOrders);
      alert("Erro ao atualizar status do pedido");
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os pedidos da sua loja
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "all")
              }
              className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-card border rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 border-b bg-secondary/20 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">
                      #{order.id.slice(-4)}
                    </span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {formatDate(order.createdAt).split(" ")[1]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${orderStatusColors[order.status]}`}
                >
                  {orderStatusLabels[order.status]}
                </span>
              </div>

              {/* Scheduled Time Banner */}
              {order.scheduledPickupTime && (
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Agendado para
                    </span>
                  </div>
                  <div className="text-sm font-black text-primary">
                    {order.scheduledPickupTime.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}{" "}
                    às{" "}
                    {order.scheduledPickupTime.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="p-4 flex-1 space-y-4">
                {/* Customer */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Cliente
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate mr-2">
                      {order.customerName}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        const digits = order.customerPhone.replace(/\D/g, "");
                        if (digits)
                          window.open(`https://wa.me/${digits}`, "_blank");
                      }}
                      title="Abrir WhatsApp"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                  {order.deliveryAddress ? (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                    {order.deliveryAddress.street},{" "}
                    {order.deliveryAddress.number}
                    {order.deliveryAddress.complement
                      ? ` - ${order.deliveryAddress.complement}`
                      : ""}{" "}
                    - {order.deliveryAddress.neighborhood}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Store className="h-3.5 w-3.5" />
                      <span>Retirada no Balcão</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/50" />

                {/* Items */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Itens ({order.items.length})
                  </h4>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground line-clamp-1">
                          <span className="font-medium text-foreground">
                            {item.quantity}x
                          </span>{" "}
                          {item.productName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-secondary/10 border-t mt-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setSelectedOrder(order)}
                >
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
            Nenhum pedido encontrado
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSelectedOrder(null)}
            />

            <div className="relative bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card">
                <h2 className="text-lg font-bold text-foreground">
                  Pedido #{selectedOrder.id}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-secondary rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${orderStatusColors[selectedOrder.status]}`}
                  >
                    {orderStatusLabels[selectedOrder.status]}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDate(selectedOrder.createdAt)}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">Cliente</h3>
                    {selectedOrder.scheduledPickupTime && (
                      <div className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded text-xs font-bold">
                        <Calendar className="h-3 w-3" />
                        AGENDADO
                      </div>
                    )}
                  </div>
                  <p className="text-foreground">
                    {selectedOrder.customerName}
                  </p>
                  {selectedOrder.scheduledPickupTime && (
                    <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-md">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        Horário da{" "}
                        {selectedOrder.deliveryAddress ? "Entrega" : "Retirada"}
                      </p>
                      <p className="text-lg font-black text-primary">
                        {selectedOrder.scheduledPickupTime.toLocaleDateString(
                          "pt-BR",
                          {
                            weekday: "long",
                            day: "2-digit",
                            month: "2-digit",
                          },
                        )}{" "}
                        às{" "}
                        {selectedOrder.scheduledPickupTime.toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Telefone:</span>
                    {formatPhone(selectedOrder.customerPhone)}
                  </div>
                  {selectedOrder.customerCpf && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold">CPF:</span>
                      {formatCPF(selectedOrder.customerCpf)}
                    </div>
                  )}
                  {selectedOrder.deliveryAddress && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      <p className="font-semibold">Endereço de Entrega:</p>
                      <p>
                        {selectedOrder.deliveryAddress.street},{" "}
                        {selectedOrder.deliveryAddress.number}
                        {selectedOrder.deliveryAddress.complement
                          ? ` - ${selectedOrder.deliveryAddress.complement}`
                          : ""}{" "}
                        -{" "}
                        {selectedOrder.deliveryAddress.neighborhood},{" "}
                        {selectedOrder.deliveryAddress.city} -{" "}
                        {selectedOrder.deliveryAddress.state},
                        {selectedOrder.deliveryAddress.cep}
                      </p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-medium text-foreground mb-2">
                    Itens do Pedido
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-secondary/30 rounded-lg border border-border"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-3 flex-1">
                            <div className="bg-background border px-2 py-1 rounded text-sm font-bold h-fit shrink-0">
                              {item.quantity}x
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {item.productName}
                              </p>

                              {/* Flavors */}
                              {item.selectedFlavors &&
                              item.selectedFlavors.length > 0 ? (
                                <div className="mt-1.5 space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Sabores
                                  </p>
                                  <ul className="text-sm text-muted-foreground space-y-0.5">
                                    {item.selectedFlavors.map((flavor, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-center gap-2"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                        {item.selectedFlavors!.length > 1
                                          ? `1/${item.selectedFlavors!.length} ${flavor}`
                                          : flavor}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                item.selectedFlavor && (
                                  <div className="mt-1.5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Sabor
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.selectedFlavor}
                                    </p>
                                  </div>
                                )
                              )}

                              {/* Combo Items */}
                              {item.comboItems &&
                                item.comboItems.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Itens do Combo
                                    </p>
                                    <ul className="text-sm text-muted-foreground space-y-0.5">
                                      {item.comboItems.map((ci, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-center gap-2"
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/30" />
                                          {ci}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                              {/* Complements */}
                              {item.selectedComplements &&
                                item.selectedComplements.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Adicionais
                                    </p>
                                    <ul className="text-sm text-muted-foreground space-y-0.5">
                                      {item.selectedComplements.map(
                                        (comp, idx) => (
                                          <li
                                            key={idx}
                                            className="flex items-center gap-2"
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/30" />
                                            <span>
                                              {comp.quantity}x {comp.name}
                                              {comp.price > 0 && (
                                                <span className="text-xs ml-1 opacity-70">
                                                  (+
                                                  {formatCurrency(
                                                    comp.price * comp.quantity,
                                                  )}
                                                  )
                                                </span>
                                              )}
                                            </span>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {/* Removed Ingredients */}
                              {item.removedIngredients &&
                                item.removedIngredients.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-red-500 uppercase tracking-wider">
                                      Remover
                                    </p>
                                    <p className="text-sm text-red-500">
                                      {item.removedIngredients.join(", ")}
                                    </p>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Observações
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Payment & Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">
                      Forma de Pagamento
                    </span>
                    <span className="text-foreground">
                      {paymentMethodLabels[selectedOrder.paymentMethod]}
                    </span>
                  </div>
                  {(selectedOrder.discount || 0) > 0 ? (
                    <div className="flex justify-between text-sm mb-2 text-green-600">
                      <span>
                        Desconto {selectedOrder.couponId ? "(Cupom)" : ""}
                      </span>
                      <span>- {formatCurrency(selectedOrder.discount!)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-foreground text-lg">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {selectedOrder.status === "pending" && (
                    <>
                      <Button
                        className="flex-1"
                        onClick={() => handleStatusUpdate("preparing")}
                      >
                        Aceitar Pedido
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => handleStatusUpdate("cancelled")}
                      >
                        Recusar
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === "preparing" && (
                    <Button
                      className="w-full"
                      onClick={() => handleStatusUpdate("delivered")}
                    >
                      Marcar como Entregue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
