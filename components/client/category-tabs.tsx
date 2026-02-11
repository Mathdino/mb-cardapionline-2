"use client";

import { useRef, useEffect, useState } from "react";
import type { Category } from "@/lib/types";

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftShadow(scrollLeft > 0);
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, []);

  useEffect(() => {
    // Scroll to active tab
    const activeTab = document.getElementById(`tab-${activeCategory}`);
    if (activeTab && scrollRef.current) {
      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = scrollRef.current.getBoundingClientRect();

      if (
        tabRect.left < containerRect.left ||
        tabRect.right > containerRect.right
      ) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-16 z-20 bg-background border-b shadow-sm">
      <div className="relative">
        {showLeftShadow && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        )}
        {showRightShadow && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              id={`tab-${category.id}`}
              onClick={() => onCategoryChange(category.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-bold uppercase transition-colors border-b-2 ${
                activeCategory === category.id
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
