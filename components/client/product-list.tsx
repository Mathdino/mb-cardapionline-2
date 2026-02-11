"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { ProductModal } from "./product-modal";

interface ProductListProps {
  categories: Category[];
  products: Product[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  scrollTrigger?: { id: string; ts: number } | null;
}

export function ProductList({
  categories,
  products,
  activeCategory,
  onCategoryChange,
  scrollTrigger,
}: ProductListProps) {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(Object.fromEntries(categories.map((c) => [c.id, true])));
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Scroll to category when scrollTrigger changes
  useEffect(() => {
    if (scrollTrigger?.id) {
      const categoryElement = categoryRefs.current[scrollTrigger.id];
      if (categoryElement) {
        const headerOffset = 60; // Sticky tabs height
        const elementPosition = categoryElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  }, [scrollTrigger]);

  // Update active category based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for sticky header

      for (const category of categories) {
        const element = categoryRefs.current[category.id];
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          if (top <= 100 && bottom > 100) {
            if (activeCategory !== category.id) {
              onCategoryChange(category.id);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories, activeCategory, onCategoryChange]);

  return (
    <>
      <div className="pb-20">
        {categories.map((category) => {
          const categoryProducts = products.filter(
            (p) => p.categoryId === category.id,
          );
          const isExpanded = expandedCategories[category.id];

          if (categoryProducts.length === 0) return null;

          return (
            <div
              key={category.id}
              ref={(el) => {
                categoryRefs.current[category.id] = el;
              }}
              className="border-b last:border-b-0"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
              >
                <h2 className="text-lg font-bold text-foreground">
                  {category.name}
                </h2>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Products */}
              {isExpanded && (
                <div>
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        products={products}
      />
    </>
  );
}
