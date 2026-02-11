"use client";

import React, { useEffect } from "react";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoodLoading } from "@/components/ui/food-loading";

export default function CategoriasPage() {
  const { getCompany } = useAuth();
  const company = getCompany();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: "", order: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (company?.id) {
        const data = await getCategories(company.id);
        setCategories(data);
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

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, order: category.order });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", order: categories.length + 1 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", order: 1 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        const result = await updateCategory(
          editingCategory.id,
          company.id,
          formData.name,
          formData.order,
        );
        if (result.success) {
          setCategories((prev) =>
            prev
              .map((c) => (c.id === editingCategory.id ? result.category : c))
              .sort((a, b) => a.order - b.order),
          );
        }
      } else {
        const result = await createCategory(
          company.id,
          formData.name,
          formData.order,
        );
        if (result.success) {
          setCategories((prev) =>
            [...prev, result.category].sort((a, b) => a.order - b.order),
          );
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Erro ao salvar categoria");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      const result = await deleteCategory(categoryId, company.id);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      } else {
        alert("Erro ao excluir categoria");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground mt-1">
            Organize seus produtos em categorias
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Categories List */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">
            Nenhuma categoria cadastrada. Clique em "Nova Categoria" para
            começar.
          </p>
        ) : (
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="cursor-move text-muted-foreground hover:text-foreground">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ordem: {category.order} • {category._count?.products || 0}{" "}
                      produtos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenModal(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-foreground">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Lanches, Bebidas..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
