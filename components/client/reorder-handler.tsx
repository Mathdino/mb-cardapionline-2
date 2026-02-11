"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";
import {
  Product,
  ProductFlavor,
  SelectedComboItem,
  ComboItem,
} from "@/lib/types";
import { toast } from "sonner";

interface ReorderHandlerProps {
  products: Product[];
  companyId: string;
}

export function ReorderHandler({ products, companyId }: ReorderHandlerProps) {
  const { addItem } = useCart();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const pendingReorder = localStorage.getItem("pendingReorder");
    if (!pendingReorder) return;

    try {
      const { items, companyId: targetCompanyId } = JSON.parse(pendingReorder);

      // Only process if it's for the current company
      if (targetCompanyId !== companyId) return;

      let addedCount = 0;

      items.forEach((item: any) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;

        // Reconstruct Flavors
        let selectedFlavors: ProductFlavor[] = [];
        if (item.selectedFlavors && item.selectedFlavors.length > 0) {
          const productFlavors = Array.isArray(product.flavors)
            ? product.flavors
            : product.flavors?.options || [];

          selectedFlavors = productFlavors.filter((f) =>
            item.selectedFlavors.includes(f.name),
          );
        } else if (item.selectedFlavor) {
          // Backward compatibility
          const productFlavors = Array.isArray(product.flavors)
            ? product.flavors
            : product.flavors?.options || [];
          const flavor = productFlavors.find(
            (f) => f.name === item.selectedFlavor,
          );
          if (flavor) selectedFlavors.push(flavor);
        }

        // Reconstruct Combo Items
        let selectedComboItems: SelectedComboItem[] = [];
        if (item.comboItems && item.comboItems.length > 0) {
          item.comboItems.forEach((comboString: string) => {
            const match = comboString.match(/^(\d+)x (.+)$/);
            if (match) {
              const quantity = parseInt(match[1]);
              const name = match[2];

              // Search in top-level options
              let comboOption: ComboItem | undefined =
                product.comboConfig?.options.find((o) => o.name === name);

              // Search in groups if not found
              if (!comboOption && product.comboConfig?.groups) {
                for (const group of product.comboConfig.groups) {
                  const found = group.options?.find((o) => o.name === name);
                  if (found) {
                    comboOption = found;
                    break;
                  }
                }
              }

              if (comboOption) {
                selectedComboItems.push({
                  ...comboOption,
                  quantity,
                });
              }
            }
          });
        }

        addItem(
          product,
          item.quantity,
          undefined, // selectedFlavor (deprecated/single)
          selectedComboItems.length > 0 ? selectedComboItems : undefined,
          item.removedIngredients,
          selectedFlavors.length > 0 ? selectedFlavors : undefined,
        );
        addedCount++;
      });

      if (addedCount > 0) {
        toast.success("Itens adicionados", {
          description: `${addedCount} itens do pedido anterior foram adicionados ao carrinho.`,
        });
      }

      // Clear after processing
      localStorage.removeItem("pendingReorder");
      processedRef.current = true;
    } catch (e) {
      console.error("Error processing reorder:", e);
    }
  }, [products, companyId, addItem]);

  return null;
}
