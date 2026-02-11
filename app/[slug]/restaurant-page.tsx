"use client";

import { useState } from "react";
import type { Company, Category, Product } from "@/lib/types";
import { CartProvider } from "@/lib/cart-context";
import { RestaurantHeader } from "@/components/client/restaurant-header";
import { ScrollHeader } from "@/components/client/scroll-header";
import { CategoryTabs } from "@/components/client/category-tabs";
import { ProductList } from "@/components/client/product-list";
import { CartSheet } from "@/components/client/cart-sheet";
import { ReorderHandler } from "@/components/client/reorder-handler";

interface RestaurantPageProps {
  company: Company;
  categories: Category[];
  products: Product[];
}

const RestaurantPage = ({
  company,
  categories,
  products,
}: RestaurantPageProps) => {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "");
  const [scrollTrigger, setScrollTrigger] = useState<{
    id: string;
    ts: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    setScrollTrigger({ id, ts: Date.now() });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCategories = categories.filter((c) =>
    filteredProducts.some((p) => p.categoryId === c.id),
  );

  return (
    <CartProvider>
      <ReorderHandler products={products} companyId={company.id} />
      <div className="min-h-screen bg-background max-w-lg mx-auto relative">
        <ScrollHeader company={company} onSearch={setSearchQuery} />
        <RestaurantHeader company={company} />

        <CategoryTabs
          categories={filteredCategories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryClick}
        />

        <ProductList
          categories={filteredCategories}
          products={filteredProducts}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          scrollTrigger={scrollTrigger}
        />

        <CartSheet company={company} />
      </div>
    </CartProvider>
  );
};

export default RestaurantPage;
