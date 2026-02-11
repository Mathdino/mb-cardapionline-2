"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/mock-data";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/actions/products";
import { getCategories } from "@/app/actions/categories";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
} from "@/app/actions/promotions";
import type { Product, Promotion } from "@/lib/types";
import { Plus, Pencil, Trash2, X, Tag, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/client/image-cropper";
import { FoodLoading } from "@/components/ui/food-loading";

export default function PromocoesPage() {
  const { getCompany } = useAuth();
  const company = getCompany();

  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [comboFormData, setComboFormData] = useState({
    name: "",
    description: "",
    price: "0",
    categoryId: "",
    image: "",
    comboConfig: {
      maxItems: "1",
      options: [] as { id: string; name: string; price: string }[],
      groups: [] as {
        id: string;
        title: string;
        type: "products" | "custom";
        min: string;
        max: string;
        productIds: string[];
        productPrices: Record<string, string>;
        options: { id: string; name: string; price: string }[];
      }[],
    },
  });
  const [editingComboId, setEditingComboId] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );
  const [formData, setFormData] = useState({
    productId: "",
    promotionalPrice: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    async function loadData() {
      if (company?.id) {
        setIsLoading(true);
        try {
          const [productsData, promotionsData, categoriesData] =
            await Promise.all([
              getProducts(company.id),
              getPromotions(company.id),
              getCategories(company.id),
            ]);
          setProducts(productsData as unknown as Product[]);
          setPromotions(promotionsData as unknown as Promotion[]);
          setCategories(categoriesData);
        } catch (error) {
          console.error("Failed to load data", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadData();
  }, [company]);

  if (!company) return null;

  const getProductById = (id: string): Product | undefined =>
    products.find((p) => p.id === id);

  const handleOpenModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        productId: promotion.productId,
        promotionalPrice: promotion.promotionalPrice.toString(),
        startDate: new Date(promotion.startDate).toISOString().split("T")[0],
        endDate: new Date(promotion.endDate).toISOString().split("T")[0],
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        productId: "",
        promotionalPrice: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromotion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    const product = getProductById(formData.productId);
    if (!product) return;

    try {
      if (editingPromotion) {
        const result = await updatePromotion(
          editingPromotion.id,
          company.id,
          formData,
        );
        if (result.success && result.promotion) {
          const updatedPromo = {
            ...result.promotion,
            originalPrice: product.price,
          };
          setPromotions((prev) =>
            prev.map((p) => (p.id === updatedPromo.id ? updatedPromo : p)),
          );
        }
      } else {
        const result = await createPromotion(company.id, formData);
        if (result.success && result.promotion) {
          const newPromo = {
            ...result.promotion,
            originalPrice: product.price,
          };
          setPromotions((prev) => [newPromo, ...prev]);
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving promotion:", error);
      alert("Erro ao salvar promoção");
    }
  };

  const handleDelete = async (promotionId: string) => {
    if (!company) return;
    if (confirm("Tem certeza que deseja excluir esta promoção?")) {
      const result = await deletePromotion(promotionId, company.id);
      if (result.success) {
        setPromotions((prev) => prev.filter((p) => p.id !== promotionId));
      } else {
        alert("Erro ao excluir promoção");
      }
    }
  };

  const handleAddComboGroup = () => {
    setComboFormData((prev) => ({
      ...prev,
      comboConfig: {
        ...prev.comboConfig,
        groups: [
          {
            id: crypto.randomUUID(),
            title: "",
            type: "products",
            min: "0",
            max: "1",
            productIds: [],
            productPrices: {},
            options: [],
          },
          ...prev.comboConfig.groups,
        ],
      },
    }));
  };

  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      setIsLoading(true);
      const productData = {
        name: comboFormData.name,
        description: comboFormData.description,
        price: parseFloat(comboFormData.price),
        categoryId: comboFormData.categoryId,
        image: comboFormData.image,
        productType: "combo",
        ingredients: [],
        flavors: null,
        comboConfig: {
          ...comboFormData.comboConfig,
          groups: comboFormData.comboConfig.groups.map((group) => ({
            ...group,
            min: parseInt(group.min),
            max: parseInt(group.max),
            productPrices: Object.fromEntries(
              Object.entries(group.productPrices || {}).map(([k, v]) => [
                k,
                parseFloat(v),
              ]),
            ),
            options: group.options.map((opt) => ({
              id: opt.id,
              name: opt.name,
              priceModifier: parseFloat(opt.price),
            })),
          })),
        },
      };

      let result;
      if (editingComboId) {
        result = await updateProduct(editingComboId, company.id, productData);
      } else {
        result = await createProduct(company.id, productData);
      }

      if (result.success) {
        // Refresh data
        const [productsData, promotionsData] = await Promise.all([
          getProducts(company.id),
          getPromotions(company.id),
        ]);
        setProducts(productsData as unknown as Product[]);
        setPromotions(promotionsData as unknown as Promotion[]);

        setIsComboModalOpen(false);
        setEditingComboId(null);
        setComboFormData({
          name: "",
          description: "",
          price: "",
          categoryId: "",
          image: "",
          comboConfig: {
            maxItems: "1",
            options: [] as { id: string; name: string; price: string }[],
            groups: [] as {
              id: string;
              title: string;
              type: "products" | "custom";
              min: string;
              max: string;
              productIds: string[];
              productPrices: Record<string, string>;
              options: { id: string; name: string; price: string }[];
            }[],
          },
        });
      } else {
        alert(result.error || "Erro ao salvar combo");
      }
    } catch (error) {
      console.error("Failed to create/update combo", error);
      alert("Erro inesperado ao salvar combo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCombo = (product: Product) => {
    const comboConfig = product.comboConfig as any;
    setEditingComboId(product.id);
    setComboFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId,
      image: product.image,
      comboConfig: {
        maxItems: comboConfig?.maxItems || "1",
        options: comboConfig?.options || [],
        groups: (comboConfig?.groups || []).map((g: any) => ({
          ...g,
          min: g.min.toString(),
          max: g.max.toString(),
          productPrices: Object.fromEntries(
            Object.entries(g.productPrices || {}).map(([k, v]) => [
              k,
              String(v),
            ]),
          ),
          options: (g.options || []).map((o: any) => ({
            ...o,
            price: (o.priceModifier ?? 0).toString(),
          })),
        })),
      },
    });
    setIsComboModalOpen(true);
  };

  const handleDeleteCombo = async (productId: string) => {
    if (!company) return;
    if (confirm("Tem certeza que deseja excluir este combo?")) {
      const result = await deleteProduct(productId, company.id);
      if (result.success) {
        const productsData = await getProducts(company.id);
        setProducts(productsData as unknown as Product[]);
      } else {
        alert("Erro ao excluir combo");
      }
    }
  };

  const toggleActive = async (promotionId: string) => {
    if (!company) return;
    const result = await togglePromotionStatus(promotionId, company.id);
    if (result.success) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === promotionId ? { ...p, isActive: !p.isActive } : p,
        ),
      );
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setTempImageSrc(reader.result?.toString() || null);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", croppedImageBlob, "image.png");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setComboFormData((prev) => ({ ...prev, image: data.url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promoções</h1>
          <p className="text-muted-foreground mt-1">
            Crie promoções para aumentar suas vendas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsComboModalOpen(true)} variant="secondary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Combo
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Promoção
          </Button>
        </div>
      </div>

      {/* Combos List */}
      {products.filter((p) => p.productType === "combo").length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Combos Ativos</h2>
          <div className="grid gap-4">
            {products
              .filter((p) => p.productType === "combo")
              .map((combo) => (
                <div
                  key={combo.id}
                  className="bg-card border rounded-xl overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="relative h-32 md:h-auto md:w-48 bg-secondary flex-shrink-0">
                      <Image
                        src={combo.image || "/placeholder.svg"}
                        alt={combo.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-foreground">
                            {combo.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {combo.description}
                          </p>
                          <div className="mt-2 text-xl font-bold text-primary">
                            Variável
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCombo(combo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCombo(combo.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Promotions List */}
      <div className="grid gap-4">
        {promotions.length === 0 && !isLoading ? (
          <div className="bg-card border rounded-xl p-8 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Nenhuma promoção cadastrada. Clique em "Nova Promoção" para
              começar.
            </p>
          </div>
        ) : (
          promotions.map((promotion) => {
            const product = getProductById(promotion.productId);
            if (!product) return null;

            const discount = Math.round(
              ((promotion.originalPrice - promotion.promotionalPrice) /
                promotion.originalPrice) *
                100,
            );

            return (
              <div
                key={promotion.id}
                className={`bg-card border rounded-xl overflow-hidden ${!promotion.isActive ? "opacity-60" : ""}`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Product Image */}
                  <div className="relative h-32 md:h-auto md:w-48 bg-secondary flex-shrink-0">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
                      -{discount}%
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-foreground">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.description}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-lg text-muted-foreground line-through">
                            {formatCurrency(promotion.originalPrice)}
                          </span>
                          <span className="text-2xl font-bold text-red-600">
                            {formatCurrency(promotion.promotionalPrice)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>De: {formatDate(promotion.startDate)}</span>
                          <span>Até: {formatDate(promotion.endDate)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            promotion.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {promotion.isActive ? "Ativa" : "Inativa"}
                        </span>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(promotion.id)}
                          >
                            {promotion.isActive ? "Desativar" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(promotion)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(promotion.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isComboModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
          <div className="bg-background p-6 rounded-lg w-full max-w-4xl my-8 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Adicionar Novo Combo</h2>
              <button onClick={() => setIsComboModalOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCombo} className="space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded bg-background"
                  value={comboFormData.name}
                  onChange={(e) =>
                    setComboFormData({
                      ...comboFormData,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Imagem do Combo
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video bg-secondary rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors group cursor-pointer"
                >
                  {comboFormData.image ? (
                    <Image
                      src={comboFormData.image}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-2" />
                      <span className="text-xs">Clique para fazer upload</span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <textarea
                  className="w-full p-2 border rounded bg-background"
                  value={comboFormData.description}
                  onChange={(e) =>
                    setComboFormData({
                      ...comboFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Categoria
                </label>
                <select
                  required
                  className="w-full p-2 border rounded bg-background"
                  value={comboFormData.categoryId}
                  onChange={(e) =>
                    setComboFormData({
                      ...comboFormData,
                      categoryId: e.target.value,
                    })
                  }
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Combo Groups */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Configuração do Combo</h3>
                  <Button
                    type="button"
                    onClick={handleAddComboGroup}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Grupo
                  </Button>
                </div>

                <div className="space-y-4">
                  {comboFormData.comboConfig.groups.map((group, idx) => (
                    <div
                      key={group.id}
                      className="border p-4 rounded-lg bg-secondary/10"
                    >
                      <div className="flex justify-between mb-3">
                        <h4 className="font-semibold">
                          Grupo {comboFormData.comboConfig.groups.length - idx}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newGroups =
                              comboFormData.comboConfig.groups.filter(
                                (g) => g.id !== group.id,
                              );
                            setComboFormData({
                              ...comboFormData,
                              comboConfig: {
                                ...comboFormData.comboConfig,
                                groups: newGroups,
                              },
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          placeholder="Título (ex: Escolha a Bebida)"
                          className="p-2 border rounded text-sm bg-background"
                          value={group.title}
                          onChange={(e) => {
                            const newGroups = [
                              ...comboFormData.comboConfig.groups,
                            ];
                            newGroups[idx].title = e.target.value;
                            setComboFormData({
                              ...comboFormData,
                              comboConfig: {
                                ...comboFormData.comboConfig,
                                groups: newGroups,
                              },
                            });
                          }}
                        />
                        <select
                          className="p-2 border rounded text-sm bg-background"
                          value={group.type}
                          onChange={(e) => {
                            const newGroups = [
                              ...comboFormData.comboConfig.groups,
                            ];
                            newGroups[idx].type = e.target.value as any;
                            setComboFormData({
                              ...comboFormData,
                              comboConfig: {
                                ...comboFormData.comboConfig,
                                groups: newGroups,
                              },
                            });
                          }}
                        >
                          <option value="products">Produtos</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>

                      <div className="flex gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Escolhas Min:</span>
                          <input
                            type="number"
                            className="w-16 p-1 border rounded text-sm bg-background"
                            value={group.min}
                            onChange={(e) => {
                              const newGroups = [
                                ...comboFormData.comboConfig.groups,
                              ];
                              newGroups[idx].min = e.target.value;
                              setComboFormData({
                                ...comboFormData,
                                comboConfig: {
                                  ...comboFormData.comboConfig,
                                  groups: newGroups,
                                },
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">Escolhas Max:</span>
                          <input
                            type="number"
                            className="w-16 p-1 border rounded text-sm bg-background"
                            value={group.max}
                            onChange={(e) => {
                              const newGroups = [
                                ...comboFormData.comboConfig.groups,
                              ];
                              newGroups[idx].max = e.target.value;
                              setComboFormData({
                                ...comboFormData,
                                comboConfig: {
                                  ...comboFormData.comboConfig,
                                  groups: newGroups,
                                },
                              });
                            }}
                          />
                        </div>
                      </div>

                      {/* Group Content */}
                      {group.type === "products" ? (
                        <div className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <select
                              className="flex-1 p-2 border rounded text-sm bg-background"
                              onChange={(e) => {
                                const catId = e.target.value;
                                if (!catId) return;

                                const productsInCat = products.filter(
                                  (p) => p.categoryId === catId,
                                );

                                if (productsInCat.length === 0) {
                                  alert("Esta categoria não possui produtos.");
                                  e.target.value = "";
                                  return;
                                }

                                const newGroups = [
                                  ...comboFormData.comboConfig.groups,
                                ];
                                const currentIds = new Set(
                                  newGroups[idx].productIds,
                                );

                                productsInCat.forEach((p) =>
                                  currentIds.add(p.id),
                                );

                                newGroups[idx].productIds =
                                  Array.from(currentIds);

                                setComboFormData({
                                  ...comboFormData,
                                  comboConfig: {
                                    ...comboFormData.comboConfig,
                                    groups: newGroups,
                                  },
                                });
                                e.target.value = "";
                              }}
                            >
                              <option value="">
                                Adicionar produtos da categoria...
                              </option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="max-h-40 overflow-y-auto border p-2 rounded bg-background">
                            {products.map((prod) => (
                              <div
                                key={prod.id}
                                className="flex items-center justify-between gap-2 p-1 hover:bg-secondary"
                              >
                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={group.productIds.includes(prod.id)}
                                    onChange={(e) => {
                                      const newGroups = [
                                        ...comboFormData.comboConfig.groups,
                                      ];
                                      if (e.target.checked) {
                                        newGroups[idx].productIds.push(prod.id);
                                      } else {
                                        newGroups[idx].productIds = newGroups[
                                          idx
                                        ].productIds.filter(
                                          (id) => id !== prod.id,
                                        );
                                        // Optional: remove price override if unchecked
                                        if (newGroups[idx].productPrices) {
                                          delete newGroups[idx].productPrices[
                                            prod.id
                                          ];
                                        }
                                      }
                                      setComboFormData({
                                        ...comboFormData,
                                        comboConfig: {
                                          ...comboFormData.comboConfig,
                                          groups: newGroups,
                                        },
                                      });
                                    }}
                                  />
                                  <span className="text-sm">{prod.name}</span>
                                </label>
                                {group.productIds.includes(prod.id) && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-muted-foreground">
                                      R$
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder={prod.price.toString()}
                                      className="w-20 p-1 border rounded text-sm bg-background"
                                      value={
                                        group.productPrices?.[prod.id] ?? ""
                                      }
                                      onChange={(e) => {
                                        const newGroups = [
                                          ...comboFormData.comboConfig.groups,
                                        ];
                                        if (!newGroups[idx].productPrices) {
                                          newGroups[idx].productPrices = {};
                                        }
                                        newGroups[idx].productPrices[prod.id] =
                                          e.target.value;
                                        setComboFormData({
                                          ...comboFormData,
                                          comboConfig: {
                                            ...comboFormData.comboConfig,
                                            groups: newGroups,
                                          },
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {group.options.map((opt, optIdx) => (
                            <div key={opt.id} className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Nome do Produto
                                </label>
                                <input
                                  placeholder="Nome"
                                  className="w-full p-1 border rounded text-sm bg-background"
                                  value={opt.name}
                                  onChange={(e) => {
                                    const newGroups = [
                                      ...comboFormData.comboConfig.groups,
                                    ];
                                    newGroups[idx].options[optIdx].name =
                                      e.target.value;
                                    setComboFormData({
                                      ...comboFormData,
                                      comboConfig: {
                                        ...comboFormData.comboConfig,
                                        groups: newGroups,
                                      },
                                    });
                                  }}
                                />
                              </div>
                              <div className="w-24">
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Preço
                                </label>
                                <input
                                  placeholder="0.00"
                                  type="number"
                                  className="w-full p-1 border rounded text-sm bg-background"
                                  value={opt.price}
                                  onChange={(e) => {
                                    const newGroups = [
                                      ...comboFormData.comboConfig.groups,
                                    ];
                                    newGroups[idx].options[optIdx].price =
                                      e.target.value;
                                    setComboFormData({
                                      ...comboFormData,
                                      comboConfig: {
                                        ...comboFormData.comboConfig,
                                        groups: newGroups,
                                      },
                                    });
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                className="mb-[5px] p-1 text-destructive hover:bg-destructive/10 rounded"
                                onClick={() => {
                                  const newGroups = [
                                    ...comboFormData.comboConfig.groups,
                                  ];
                                  newGroups[idx].options = newGroups[
                                    idx
                                  ].options.filter((o) => o.id !== opt.id);
                                  setComboFormData({
                                    ...comboFormData,
                                    comboConfig: {
                                      ...comboFormData.comboConfig,
                                      groups: newGroups,
                                    },
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newGroups = [
                                ...comboFormData.comboConfig.groups,
                              ];
                              newGroups[idx].options.push({
                                id: crypto.randomUUID(),
                                name: "",
                                price: "0",
                              });
                              setComboFormData({
                                ...comboFormData,
                                comboConfig: {
                                  ...comboFormData.comboConfig,
                                  groups: newGroups,
                                },
                              });
                            }}
                          >
                            + Adicionar Opção de Produto
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsComboModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Criar Combo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          />

          <div className="relative w-full max-w-md bg-background rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-foreground">
                {editingPromotion ? "Editar Promoção" : "Nova Promoção"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-secondary rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Produto
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      productId: e.target.value,
                    }))
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
              </div>

              {formData.productId && (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Preço original:{" "}
                    <strong className="text-foreground">
                      {formatCurrency(
                        getProductById(formData.productId)?.price || 0,
                      )}
                    </strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Preço Promocional (R$)
                </label>
                <input
                  type="number"
                  value={formData.promotionalPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      promotionalPrice: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1 bg-transparent"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  {editingPromotion ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ImageCropper
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
