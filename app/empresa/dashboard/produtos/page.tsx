"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { getCategories } from "@/app/actions/categories";
import {
  getProducts,
  getStoreProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/actions/products";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/client/image-cropper";
import { FoodLoading } from "@/components/ui/food-loading";

function ProdutosContent() {
  const searchParams = useSearchParams();
  const { getCompany } = useAuth();
  const company = getCompany();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    promotionalPrice: "",
    isPromotion: false,
    categoryId: "",
    productType: "simple" as
      | "simple"
      | "flavors"
      | "combo"
      | "wholesale"
      | "complements",
    image: "",
    ingredients: [] as string[],
    preparationTime: "0",
    preparationTimeUnit: "hours" as "hours" | "days",
    wholesaleMinQuantity: "10",
    wholesalePrice: "",
    flavors: [] as { id: string; name: string; price: string }[],
    minFlavors: "1",
    maxFlavors: "1",
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
        options: { id: string; name: string; price: string }[];
      }[],
    },
    complements: [] as {
      id: string;
      name: string;
      min: string;
      max: string;
      items: {
        id: string;
        name: string;
        price: string;
        available: boolean;
      }[];
    }[],
  });

  const [newComplementGroup, setNewComplementGroup] = useState({
    name: "",
    min: "0",
  });
  const [newComplementItem, setNewComplementItem] = useState({
    name: "",
    price: "",
  });

  const [newFlavor, setNewFlavor] = useState({ name: "", price: "" });
  const [newComboOption, setNewComboOption] = useState({ name: "", price: "" });
  const [newIngredient, setNewIngredient] = useState("");

  const handleAddIngredient = () => {
    if (!newIngredient.trim()) return;
    setFormData((prev) => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), newIngredient.trim()],
    }));
    setNewIngredient("");
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddFlavor = () => {
    if (!newFlavor.name) return;
    setFormData((prev) => ({
      ...prev,
      flavors: [
        ...prev.flavors,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: newFlavor.name,
          price: newFlavor.price || "0",
        },
      ],
    }));
    setNewFlavor({ name: "", price: "" });
  };

  const handleRemoveFlavor = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      flavors: prev.flavors.filter((f) => f.id !== id),
    }));
  };

  const handleAddComboOption = () => {
    if (!newComboOption.name) return;
    setFormData((prev) => ({
      ...prev,
      comboConfig: {
        ...prev.comboConfig,
        options: [
          ...prev.comboConfig.options,
          {
            id: Math.random().toString(36).substr(2, 9),
            name: newComboOption.name,
            price: newComboOption.price || "0",
          },
        ],
      },
    }));
    setNewComboOption({ name: "", price: "" });
  };

  const handleRemoveComboOption = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      comboConfig: {
        ...prev.comboConfig,
        options: prev.comboConfig.options.filter((o) => o.id !== id),
      },
    }));
  };

  const handleAddComplementGroup = () => {
    if (!newComplementGroup.name) return;
    setFormData((prev) => ({
      ...prev,
      complements: [
        ...prev.complements,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: newComplementGroup.name,
          min: newComplementGroup.min || "0",
          max: "999",
          items: [],
        },
      ],
    }));
    setNewComplementGroup({ name: "", min: "0" });
  };

  const handleRemoveComplementGroup = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      complements: prev.complements.filter((c) => c.id !== id),
    }));
  };

  const handleAddComplementItem = (
    groupId: string,
    item: { name: string; price: string },
  ) => {
    if (!item.name) return;
    setFormData((prev) => ({
      ...prev,
      complements: prev.complements.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            items: [
              ...group.items,
              {
                id: Math.random().toString(36).substr(2, 9),
                name: item.name,
                price: item.price || "0",
                available: true,
              },
            ],
          };
        }
        return group;
      }),
    }));
  };

  const handleRemoveComplementItem = (groupId: string, itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      complements: prev.complements.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            items: group.items.filter((item) => item.id !== itemId),
          };
        }
        return group;
      }),
    }));
  };

  useEffect(() => {
    async function load() {
      if (company?.id) {
        const [productsData, categoriesData] = await Promise.all([
          getStoreProducts(company.id),
          getCategories(company.id),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      }
      setLoading(false);
    }
    load();
  }, [company]);

  if (!company) return null;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FoodLoading logoSrc={company?.profileImage} />
      </div>
    );
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sem categoria";
  };

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        promotionalPrice: product.promotionalPrice?.toString() || "",
        isPromotion: product.isPromotion || false,
        categoryId: product.categoryId,
        productType: product.productType as any,
        image: product.image,
        ingredients: product.ingredients || [],
        preparationTime: product.preparationTime?.toString() || "0",
        preparationTimeUnit: (product.preparationTimeUnit as any) || "hours",
        wholesaleMinQuantity: product.wholesaleMinQuantity?.toString() || "10",
        wholesalePrice: product.wholesalePrice?.toString() || "",
        complements: product.complements
          ? product.complements.map((g: any) => ({
              id: g.id,
              name: g.name,
              min: (g.min || 0).toString(),
              max: (g.max || 0).toString(),
              items: g.items.map((i: any) => ({
                id: i.id,
                name: i.name,
                price: i.price.toString(),
                available: i.available ?? true,
              })),
            }))
          : [],
        flavors: Array.isArray(product.flavors)
          ? product.flavors.map((f: any) => ({
              ...f,
              price: f.priceModifier.toString(),
            }))
          : product.flavors?.options
            ? product.flavors.options.map((f: any) => ({
                ...f,
                price: f.priceModifier.toString(),
              }))
            : [],
        minFlavors: product.flavors?.min?.toString() || "1",
        maxFlavors: product.flavors?.max?.toString() || "1",
        comboConfig: product.comboConfig
          ? {
              maxItems: product.comboConfig.maxItems.toString(),
              options: Array.isArray(product.comboConfig.options)
                ? product.comboConfig.options.map((o: any) => ({
                    ...o,
                    price: o.priceModifier.toString(),
                  }))
                : [],
              groups: Array.isArray(product.comboConfig.groups)
                ? product.comboConfig.groups.map((g: any) => ({
                    id: g.id,
                    title: g.title,
                    type: g.type,
                    min: g.min.toString(),
                    max: g.max.toString(),
                    productIds: g.productIds || [],
                    options: g.options
                      ? g.options.map((o: any) => ({
                          id: o.id,
                          name: o.name,
                          price: (o.priceModifier || o.price || 0).toString(),
                        }))
                      : [],
                  }))
                : [],
            }
          : { maxItems: "1", options: [], groups: [] },
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        promotionalPrice: "",
        isPromotion: false,
        categoryId: categories[0]?.id || "",
        productType: "simple",
        image: "",
        ingredients: [],
        preparationTime: "0",
        preparationTimeUnit: "hours",
        flavors: [],
        minFlavors: "1",
        maxFlavors: "1",
        comboConfig: { maxItems: "1", options: [], groups: [] },
        complements: [],
        wholesaleMinQuantity: "10",
        wholesalePrice: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ""; // Reset input
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
      setFormData((prev) => ({ ...prev, image: data.url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      promotionalPrice: formData.promotionalPrice
        ? parseFloat(formData.promotionalPrice) || null
        : null,
      isPromotion: formData.isPromotion,
      categoryId: formData.categoryId,
      productType: formData.productType,
      image: formData.image,
      ingredients: formData.ingredients,
      preparationTime: parseInt(formData.preparationTime) || 0,
      preparationTimeUnit: formData.preparationTimeUnit,
      wholesaleMinQuantity:
        formData.productType === "wholesale"
          ? parseInt(formData.wholesaleMinQuantity) || 0
          : null,
      wholesalePrice:
        formData.productType === "wholesale" && formData.wholesalePrice
          ? parseFloat(formData.wholesalePrice) || 0
          : null,
      flavors:
        formData.productType === "flavors"
          ? {
              min: parseInt(formData.minFlavors) || 0,
              max: parseInt(formData.maxFlavors) || 0,
              options: formData.flavors.map((f) => ({
                id: f.id,
                name: f.name,
                priceModifier: parseFloat(f.price) || 0,
              })),
            }
          : null,
      comboConfig:
        formData.productType === "combo"
          ? {
              maxItems: parseInt(formData.comboConfig.maxItems) || 1,
              options: formData.comboConfig.options.map((o) => ({
                id: o.id,
                name: o.name,
                priceModifier: parseFloat(o.price) || 0,
              })),
              groups: formData.comboConfig.groups.map((g) => ({
                id: g.id,
                title: g.title,
                type: g.type,
                min: parseInt(g.min) || 0,
                max: parseInt(g.max) || 0,
                productIds: g.productIds || [],
                options:
                  g.options?.map((o) => ({
                    id: o.id,
                    name: o.name,
                    price: parseFloat(o.price) || 0,
                  })) || [],
              })),
            }
          : null,
      complements:
        formData.productType === "complements"
          ? formData.complements.map((group) => ({
              id: group.id,
              name: group.name,
              min: parseInt(group.min) || 0,
              max: parseInt(group.max) || 0,
              items: group.items.map((item) => ({
                id: item.id,
                name: item.name,
                price: parseFloat(item.price) || 0,
                available: item.available ?? true,
              })),
            }))
          : null,
    };

    try {
      let success = false;
      if (editingProduct) {
        const result = await updateProduct(
          editingProduct.id,
          company.id,
          productData,
        );
        if (result.success) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? result.product : p)),
          );
          success = true;
        } else {
          alert(`Erro ao atualizar: ${result.error}`);
        }
      } else {
        const result = await createProduct(company.id, productData);
        if (result.success) {
          setProducts((prev) => [...prev, result.product]);
          success = true;
        } else {
          alert(`Erro ao criar: ${result.error}`);
        }
      }

      if (success) {
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert(
        `Erro ao salvar produto: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const result = await deleteProduct(productId, company.id);
      if (result.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert("Erro ao excluir produto");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o cardápio da sua loja
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="w-[250px] md:w-auto whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-card border rounded-xl p-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="w-full md:w-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-card border rounded-xl overflow-hidden flex flex-row md:flex-col group min-h-[7rem] md:h-auto"
          >
            {/* Image Section */}
            <div className="relative w-28 md:w-full h-auto md:h-48 bg-secondary flex-shrink-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              {/* Desktop Actions */}
              <div className="hidden md:flex absolute top-2 right-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenModal(product)}
                  className="p-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background transition-colors shadow-sm"
                >
                  <Pencil className="h-4 w-4 text-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-destructive/80 backdrop-blur-sm rounded-lg hover:bg-destructive text-white transition-colors shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white hidden md:block">
                {getCategoryName(product.categoryId)}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-3 md:p-4 flex-1 flex flex-col justify-between min-w-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground line-clamp-1 text-sm md:text-base">
                    {product.name}
                  </h3>
                  <div className="flex flex-col items-end flex-shrink-0">
                    {product.productType === "combo" ? (
                      <span className="font-bold text-primary whitespace-nowrap text-sm">
                        Variável
                      </span>
                    ) : product.promotionalPrice ? (
                      <>
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="font-bold text-red-600 whitespace-nowrap text-sm">
                          {formatCurrency(product.promotionalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-primary whitespace-nowrap text-sm">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 hidden md:block">
                  {product.description}
                </p>
                <div className="md:hidden text-xs text-muted-foreground line-clamp-1">
                  {getCategoryName(product.categoryId)}
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center justify-between mt-2 md:hidden">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(product)}
                    className="p-1.5 bg-secondary rounded-md text-foreground hover:bg-secondary/80"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    product.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.isAvailable ? "Ativo" : "Inativo"}
                </span>
              </div>

              {/* Desktop Footer */}
              <div className="hidden md:flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-auto">
                <span className="capitalize">
                  {product.productType === "simple"
                    ? "Simples"
                    : product.productType === "flavors"
                      ? "Com Sabores"
                      : "Combo"}
                </span>
                <span
                  className={
                    product.isAvailable ? "text-green-500" : "text-destructive"
                  }
                >
                  {product.isAvailable ? "Disponível" : "Indisponível"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            Nenhum produto encontrado
          </h3>
          <p className="text-muted-foreground mt-1">
            Tente buscar por outro termo ou categoria
          </p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Image Upload Preview */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Imagem do Produto
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative aspect-video bg-secondary rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors group cursor-pointer"
                    >
                      {formData.image ? (
                        <Image
                          src={formData.image}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8 mb-2" />
                          <span className="text-xs">
                            Clique para fazer upload
                          </span>
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
                      onChange={handleImageSelect}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: X-Bacon"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tempo de Preparo
                      </label>
                      <input
                        type="number"
                        value={formData.preparationTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            preparationTime: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Unidade
                      </label>
                      <select
                        value={formData.preparationTimeUnit}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            preparationTimeUnit: e.target.value as
                              | "hours"
                              | "days",
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="hours">Horas</option>
                        <option value="days">Dias</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-[120px]"
                      placeholder="Descreva os ingredientes e detalhes do produto..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Ingredientes (Opcional)
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newIngredient}
                          onChange={(e) => setNewIngredient(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddIngredient();
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
                          placeholder="Adicionar ingrediente (ex: Cebola)"
                        />
                        <Button
                          type="button"
                          onClick={handleAddIngredient}
                          size="sm"
                          variant="secondary"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {formData.ingredients &&
                        formData.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.ingredients.map((ingredient, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                              >
                                <span>{ingredient}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredient(index)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo de Produto
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        value="simple"
                        checked={formData.productType === "simple"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            productType: e.target.value as any,
                          }))
                        }
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Simples</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        value="flavors"
                        checked={formData.productType === "flavors"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            productType: e.target.value as any,
                          }))
                        }
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">
                        Com Sabores
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        value="combo"
                        checked={formData.productType === "combo"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            productType: e.target.value as any,
                          }))
                        }
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">
                        por Quant.
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        value="wholesale"
                        checked={formData.productType === "wholesale"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            productType: e.target.value as any,
                          }))
                        }
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Atacado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        value="complements"
                        checked={formData.productType === "complements"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            productType: e.target.value as any,
                          }))
                        }
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">
                        Com Complementos
                      </span>
                    </label>
                  </div>
                </div>

                {/* Seção de Complementos */}
                {formData.productType === "complements" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3">
                      Configuração de Complementos
                    </h4>

                    {/* Adicionar Grupo */}
                    <div className="mb-4 space-y-3 p-3 bg-background rounded-lg border">
                      <h5 className="text-sm font-medium">
                        Novo Grupo de Complementos
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="col-span-2 flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">
                              Nome do Grupo
                            </label>
                            <input
                              type="text"
                              placeholder="Nome do Grupo (ex: Molhos)"
                              value={newComplementGroup.name}
                              onChange={(e) =>
                                setNewComplementGroup((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-xs font-medium mb-1 block text-muted-foreground">
                              Quantidade Mín.
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={newComplementGroup.min}
                              onChange={(e) =>
                                setNewComplementGroup((prev) => ({
                                  ...prev,
                                  min: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            onClick={handleAddComplementGroup}
                            disabled={!newComplementGroup.name}
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Grupo
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Grupos */}
                    <div className="space-y-4">
                      {formData.complements.map((group) => (
                        <div
                          key={group.id}
                          className="border rounded-lg p-3 bg-background"
                        >
                          <div className="flex items-center justify-between mb-3 border-b pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{group.name}</span>
                              {parseInt(group.min) > 0 && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  Escolha Mínima: {group.min}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveComplementGroup(group.id)
                              }
                              className="text-destructive hover:bg-destructive/10 p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Items do Grupo */}
                          <div className="pl-4 border-l-2 border-secondary ml-1">
                            <div className="space-y-2 mb-3">
                              {group.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between text-sm bg-secondary/30 p-2 rounded"
                                >
                                  <span>
                                    {item.name} (+
                                    {formatCurrency(Number(item.price))})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveComplementItem(
                                        group.id,
                                        item.id,
                                      )
                                    }
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Adicionar Item ao Grupo */}
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Nome do Item"
                                className="flex-1 px-2 py-1 text-sm border rounded"
                                id={`input-name-${group.id}`}
                              />
                              <input
                                type="number"
                                placeholder="Preço"
                                className="w-20 px-2 py-1 text-sm border rounded"
                                id={`input-price-${group.id}`}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  const nameInput = document.getElementById(
                                    `input-name-${group.id}`,
                                  ) as HTMLInputElement;
                                  const priceInput = document.getElementById(
                                    `input-price-${group.id}`,
                                  ) as HTMLInputElement;

                                  if (nameInput && nameInput.value) {
                                    handleAddComplementItem(group.id, {
                                      name: nameInput.value,
                                      price: priceInput.value,
                                    });
                                    nameInput.value = "";
                                    priceInput.value = "";
                                    nameInput.focus();
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Atacado */}
                {formData.productType === "wholesale" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3">
                      Configuração de Atacado
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Quantidade Mínima
                        </label>
                        <input
                          type="number"
                          value={formData.wholesaleMinQuantity}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              wholesaleMinQuantity: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                          min="2"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Preço de Atacado (R$)
                        </label>
                        <input
                          type="number"
                          value={formData.wholesalePrice}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              wholesalePrice: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção de Sabores */}
                {formData.productType === "flavors" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3">Sabores</h4>

                    {/* Configuração de Quantidade */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Mínimo de Sabores
                        </label>
                        <input
                          type="number"
                          value={formData.minFlavors}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              minFlavors: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Máximo de Sabores
                        </label>
                        <input
                          type="number"
                          value={formData.maxFlavors}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              maxFlavors: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Lista de Sabores Adicionados */}
                    {formData.flavors.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {formData.flavors.map((flavor) => (
                          <div
                            key={flavor.id}
                            className="flex items-center justify-between bg-background p-2 rounded border"
                          >
                            <div className="text-sm">
                              <span className="font-medium">{flavor.name}</span>
                              {parseFloat(flavor.price) > 0 && (
                                <span className="text-muted-foreground ml-2">
                                  (+{formatCurrency(parseFloat(flavor.price))})
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFlavor(flavor.id)}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar Novo Sabor */}
                    <div className="flex flex-col md:flex-row gap-2 md:items-end">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Nome do Sabor
                        </label>
                        <input
                          type="text"
                          value={newFlavor.name}
                          onChange={(e) =>
                            setNewFlavor((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                          placeholder="Ex: Bacon"
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="w-full md:w-24 flex-1 md:flex-none">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Valor (+)
                          </label>
                          <input
                            type="number"
                            value={newFlavor.price}
                            onChange={(e) =>
                              setNewFlavor((prev) => ({
                                ...prev,
                                price: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleAddFlavor}
                          size="sm"
                          variant="secondary"
                          className="mb-[1px]"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção de Combo */}
                {formData.productType === "combo" && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg border">
                    <h4 className="font-medium text-sm mb-3">
                      Configuração do Combo
                    </h4>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                        Adicione grupos de escolha para o combo (ex: "Escolha 2
                        Lanches", "Adicionais Obrigatórios").
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            comboConfig: {
                              ...prev.comboConfig,
                              groups: [
                                ...prev.comboConfig.groups,
                                {
                                  id: Math.random().toString(36).substr(2, 9),
                                  title: "",
                                  type: "products",
                                  min: "1",
                                  max: "1",
                                  productIds: [],
                                  options: [],
                                },
                              ],
                            },
                          }));
                        }}
                        className="border-dashed border-2"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Grupo ao
                        Combo
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {formData.comboConfig?.groups?.map(
                        (group, groupIndex) => (
                          <div
                            key={group.id}
                            className="bg-background border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h5 className="font-medium text-sm">
                                Grupo {groupIndex + 1}
                              </h5>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    comboConfig: {
                                      ...prev.comboConfig,
                                      groups: prev.comboConfig.groups.filter(
                                        (g) => g.id !== group.id,
                                      ),
                                    },
                                  }));
                                }}
                                className="text-destructive hover:bg-destructive/10 p-1 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Título do Grupo
                                </label>
                                <input
                                  type="text"
                                  value={group.title}
                                  onChange={(e) => {
                                    const newGroups = [
                                      ...formData.comboConfig.groups,
                                    ];
                                    newGroups[groupIndex].title =
                                      e.target.value;
                                    setFormData((prev) => ({
                                      ...prev,
                                      comboConfig: {
                                        ...prev.comboConfig,
                                        groups: newGroups,
                                      },
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                  placeholder="Ex: Escolha seu Lanche"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Tipo de Escolha
                                </label>
                                <select
                                  value={group.type}
                                  onChange={(e) => {
                                    const newGroups = [
                                      ...formData.comboConfig.groups,
                                    ];
                                    newGroups[groupIndex].type = e.target
                                      .value as any;
                                    setFormData((prev) => ({
                                      ...prev,
                                      comboConfig: {
                                        ...prev.comboConfig,
                                        groups: newGroups,
                                      },
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                >
                                  <option value="products">
                                    Produtos Cadastrados
                                  </option>
                                  <option value="custom">
                                    Itens Personalizados
                                  </option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Mínimo
                                </label>
                                <input
                                  type="number"
                                  value={group.min}
                                  onChange={(e) => {
                                    const newGroups = [
                                      ...formData.comboConfig.groups,
                                    ];
                                    newGroups[groupIndex].min = e.target.value;
                                    setFormData((prev) => ({
                                      ...prev,
                                      comboConfig: {
                                        ...prev.comboConfig,
                                        groups: newGroups,
                                      },
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  Máximo
                                </label>
                                <input
                                  type="number"
                                  value={group.max}
                                  onChange={(e) => {
                                    const newGroups = [
                                      ...formData.comboConfig.groups,
                                    ];
                                    newGroups[groupIndex].max = e.target.value;
                                    setFormData((prev) => ({
                                      ...prev,
                                      comboConfig: {
                                        ...prev.comboConfig,
                                        groups: newGroups,
                                      },
                                    }));
                                  }}
                                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                                  min="1"
                                />
                              </div>
                            </div>

                            {/* Group Content Based on Type */}
                            {group.type === "products" ? (
                              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto bg-background">
                                <label className="text-xs text-muted-foreground mb-2 block">
                                  Selecione os produtos disponíveis:
                                </label>
                                {products.map((product) => (
                                  <label
                                    key={product.id}
                                    className="flex items-center gap-2 py-1 hover:bg-secondary/50 rounded px-1 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={(
                                        group.productIds || []
                                      ).includes(product.id)}
                                      onChange={(e) => {
                                        const newGroups = [
                                          ...formData.comboConfig.groups,
                                        ];
                                        const currentIds =
                                          newGroups[groupIndex].productIds ||
                                          [];
                                        if (e.target.checked) {
                                          newGroups[groupIndex].productIds = [
                                            ...currentIds,
                                            product.id,
                                          ];
                                        } else {
                                          newGroups[groupIndex].productIds =
                                            currentIds.filter(
                                              (id) => id !== product.id,
                                            );
                                        }
                                        setFormData((prev) => ({
                                          ...prev,
                                          comboConfig: {
                                            ...prev.comboConfig,
                                            groups: newGroups,
                                          },
                                        }));
                                      }}
                                      className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm">
                                      {product.name}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <label className="text-xs text-muted-foreground block">
                                  Opções Personalizadas:
                                </label>
                                {group.options?.map((option, optIndex) => (
                                  <div
                                    key={option.id}
                                    className="flex gap-2 items-end"
                                  >
                                    <div className="flex-1">
                                      <label className="text-xs text-muted-foreground mb-1 block">
                                        Nome
                                      </label>
                                      <input
                                        type="text"
                                        value={option.name}
                                        onChange={(e) => {
                                          const newGroups = [
                                            ...formData.comboConfig.groups,
                                          ];
                                          newGroups[groupIndex].options[
                                            optIndex
                                          ].name = e.target.value;
                                          setFormData((prev) => ({
                                            ...prev,
                                            comboConfig: {
                                              ...prev.comboConfig,
                                              groups: newGroups,
                                            },
                                          }));
                                        }}
                                        className="w-full px-2 py-1 rounded border text-sm"
                                        placeholder="Nome (ex: Batata)"
                                      />
                                    </div>
                                    <div className="w-24">
                                      <label className="text-xs text-muted-foreground mb-1 block">
                                        Preço
                                      </label>
                                      <input
                                        type="number"
                                        value={option.price}
                                        onChange={(e) => {
                                          const newGroups = [
                                            ...formData.comboConfig.groups,
                                          ];
                                          newGroups[groupIndex].options[
                                            optIndex
                                          ].price = e.target.value;
                                          setFormData((prev) => ({
                                            ...prev,
                                            comboConfig: {
                                              ...prev.comboConfig,
                                              groups: newGroups,
                                            },
                                          }));
                                        }}
                                        className="w-full px-2 py-1 rounded border text-sm"
                                        placeholder="0.00"
                                        step="0.01"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newGroups = [
                                          ...formData.comboConfig.groups,
                                        ];
                                        newGroups[groupIndex].options =
                                          newGroups[groupIndex].options.filter(
                                            (_, i) => i !== optIndex,
                                          );
                                        setFormData((prev) => ({
                                          ...prev,
                                          comboConfig: {
                                            ...prev.comboConfig,
                                            groups: newGroups,
                                          },
                                        }));
                                      }}
                                      className="text-destructive p-2 hover:bg-destructive/10 rounded mb-[1px]"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newGroups = [
                                      ...formData.comboConfig.groups,
                                    ];
                                    if (!newGroups[groupIndex].options)
                                      newGroups[groupIndex].options = [];
                                    newGroups[groupIndex].options.push({
                                      id: Math.random()
                                        .toString(36)
                                        .substr(2, 9),
                                      name: "",
                                      price: "",
                                    });
                                    setFormData((prev) => ({
                                      ...prev,
                                      comboConfig: {
                                        ...prev.comboConfig,
                                        groups: newGroups,
                                      },
                                    }));
                                  }}
                                  className="w-full"
                                >
                                  <Plus className="h-3 w-3 mr-2" /> Adicionar
                                  Opção
                                </Button>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Produto"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropper
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        aspect={16 / 9}
      />
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <ProdutosContent />
    </Suspense>
  );
}
