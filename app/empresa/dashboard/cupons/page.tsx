"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
} from "@/app/actions/coupons";
import type { Coupon } from "@/lib/types";
import { formatCurrency } from "@/lib/mock-data";
import {
  Plus,
  Trash2,
  X,
  TicketPercent,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FoodLoading } from "@/components/ui/food-loading";

export default function CuponsPage() {
  const { getCompany } = useAuth();
  const company = getCompany();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage", // 'percentage' | 'fixed'
    value: "",
    minOrderValue: "",
    maxDiscount: "",
    startDate: "",
    expirationDate: "",
    usageLimit: "",
  });

  useEffect(() => {
    async function loadData() {
      if (company?.id) {
        setIsLoading(true);
        try {
          const data = await getCoupons(company.id);
          setCoupons(data as Coupon[]);
        } catch (error) {
          console.error("Failed to load coupons", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadData();
  }, [company]);

  const handleOpenModal = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: "",
      minOrderValue: "",
      maxDiscount: "",
      startDate: "",
      expirationDate: "",
      usageLimit: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setIsSubmitting(true);
    try {
      const result = await createCoupon(company.id, formData);
      if (result.success && result.coupon) {
        setCoupons([result.coupon as Coupon, ...coupons]);
        setIsModalOpen(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao criar cupom");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!company) return;
    try {
      const result = await toggleCouponStatus(id, company.id);
      if (result.success) {
        setCoupons(
          coupons.map((c) =>
            c.id === id ? { ...c, isActive: !c.isActive } : c,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!company || !confirm("Tem certeza que deseja excluir este cupom?"))
      return;
    try {
      const result = await deleteCoupon(id, company.id);
      if (result.success) {
        setCoupons(coupons.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!company) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Cupons de Desconto
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus cupons de desconto para clientes
          </p>
        </div>
        <Button onClick={handleOpenModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {isLoading ? (
        <div className="h-full flex items-center justify-center py-12">
          <FoodLoading logoSrc={company?.profileImage} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <TicketPercent className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Nenhum cupom ativo</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Crie cupons de desconto para atrair mais clientes e aumentar suas
            vendas.
          </p>
          <Button onClick={handleOpenModal} variant="outline">
            Criar Primeiro Cupom
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-card border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${
                !coupon.isActive ? "opacity-75" : ""
              }`}
            >
              <div className="p-4 border-b bg-secondary/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TicketPercent className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">{coupon.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      coupon.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {coupon.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">
                    Desconto
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : formatCurrency(coupon.value)}
                  </span>
                </div>

                {coupon.minOrderValue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pedido Mínimo</span>
                    <span>{formatCurrency(coupon.minOrderValue)}</span>
                  </div>
                )}

                {(coupon.startDate || coupon.expirationDate) && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                    <Calendar className="h-3.5 w-3.5 mt-0.5" />
                    <div className="flex flex-col">
                      {coupon.startDate && (
                        <span>
                          De: {format(new Date(coupon.startDate), "dd/MM/yyyy")}
                        </span>
                      )}
                      {coupon.expirationDate && (
                        <span>
                          Até:{" "}
                          {format(
                            new Date(coupon.expirationDate),
                            "dd/MM/yyyy",
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {coupon.usageLimit && (
                  <div className="text-xs text-muted-foreground">
                    Uso: {coupon.usageCount} / {coupon.usageLimit}
                  </div>
                )}
              </div>

              <div className="p-3 border-t bg-secondary/10 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(coupon.id)}
                  className={
                    coupon.isActive
                      ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      : "text-green-600 hover:text-green-700 hover:bg-green-50"
                  }
                >
                  {coupon.isActive ? "Pausar" : "Ativar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(coupon.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold">Novo Cupom</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código do Cupom</label>
                <input
                  type="text"
                  required
                  placeholder="EX: DESCONTO10"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full p-2 border rounded-lg bg-background uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  O código que o cliente irá digitar (letras maiúsculas e
                  números).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Tipo de Desconto
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-background"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Valor do Desconto
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder={formData.type === "percentage" ? "10" : "5.00"}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-background"
                  />
                </div>
              </div>

              {formData.type === "percentage" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Desconto Máximo (R$) (Opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 20.00"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Limita o valor do desconto em porcentagem.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Valor Mínimo do Pedido (R$) (Opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 50.00"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    setFormData({ ...formData, minOrderValue: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Início</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expirationDate: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded-lg bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Limite de Uso (Quantidade) (Opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ex: 100"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Número máximo de vezes que este cupom pode ser utilizado no
                  total.
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Salvando...
                    </>
                  ) : (
                    "Criar Cupom"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
