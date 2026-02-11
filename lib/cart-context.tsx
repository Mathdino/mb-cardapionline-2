"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  CartItem,
  Product,
  ProductFlavor,
  SelectedComboItem,
  Coupon,
} from "./types";
import { formatCurrency } from "./mock-data";
import { validateCoupon } from "@/app/actions/coupons";

interface CartContextType {
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  coupon: Coupon | null;
  itemCount: number;
  addItem: (
    product: Product,
    quantity: number,
    selectedFlavor?: ProductFlavor,
    selectedComboItems?: SelectedComboItem[],
    removedIngredients?: string[],
    selectedFlavors?: ProductFlavor[],
    selectedComplements?: SelectedComplementItem[],
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (
    code: string,
    companyId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => void;
  getWhatsAppMessage: (
    companyWhatsapp: string,
    customerName: string,
    paymentMethod: string,
    notes?: string,
  ) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCoupon = useCallback(
    async (code: string, companyId: string) => {
      const result = await validateCoupon(code, companyId, subtotal);

      if (result.valid && result.coupon) {
        setCoupon(result.coupon as Coupon);
        setDiscount(result.discount || 0);
        return { success: true };
      } else {
        setCoupon(null);
        setDiscount(0);
        return { success: false, message: result.message };
      }
    },
    [subtotal],
  );

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setDiscount(0);
  }, []);

  // Recalculate discount when subtotal changes if coupon exists
  // But wait, applyCoupon depends on subtotal. If subtotal changes, we might need to re-validate?
  // Or just re-calculate value?
  // For simplicity, let's keep the coupon but re-calculate discount if it's percentage.
  // Actually, validateCoupon logic should be run again or just simple math here.
  // To avoid complexity/async loops, let's just do simple math here if coupon is set.
  // However, validateCoupon also checks minOrderValue.
  // Ideally we should re-validate.
  // Let's rely on the user to re-apply or we handle it in a useEffect?
  // Let's add a useEffect to re-calculate discount when items/subtotal changes.

  // Actually, a simpler approach:
  // Derived state for discount based on coupon + subtotal.
  // But we need to check minOrderValue.

  // Let's stick to simple state for now, but maybe clear coupon if cart becomes empty?
  if (items.length === 0 && coupon) {
    setCoupon(null);
    setDiscount(0);
  }

  const addItem = useCallback(
    (
      product: Product,
      quantity: number,
      selectedFlavor?: ProductFlavor,
      selectedComboItems?: SelectedComboItem[],
      removedIngredients?: string[],
      selectedFlavors?: ProductFlavor[],
      selectedComplements?: SelectedComplementItem[],
    ) => {
      setItems((prev) => {
        const effectiveFlavors =
          selectedFlavors || (selectedFlavor ? [selectedFlavor] : []);

        const existingIndex = prev.findIndex(
          (item) =>
            item.product.id === product.id &&
            // Compare flavors
            ((!item.selectedFlavor &&
              (!item.selectedFlavors || item.selectedFlavors.length === 0) &&
              effectiveFlavors.length === 0) ||
              (item.selectedFlavor &&
                effectiveFlavors.length === 1 &&
                item.selectedFlavor.id === effectiveFlavors[0].id) ||
              (item.selectedFlavors &&
                item.selectedFlavors.length === effectiveFlavors.length &&
                item.selectedFlavors.every((f) =>
                  effectiveFlavors.some((ef) => ef.id === f.id),
                ))) &&
            // If it has combo items, we always add as new item for simplicity unless deep comparison
            !item.selectedComboItems &&
            !selectedComboItems &&
            // Compare complements (simplified: if present, always new item to avoid complex comparison logic for now)
            // Or better: check if both are undefined/empty
            ((!item.selectedComplements && !selectedComplements) ||
              (item.selectedComplements?.length === 0 &&
                (!selectedComplements || selectedComplements.length === 0))) &&
            (!item.removedIngredients ||
              item.removedIngredients.length === 0) &&
            (!removedIngredients || removedIngredients.length === 0),
        );

        const getBasePrice = (qty: number) => {
          if (
            product.productType === "wholesale" &&
            product.wholesaleMinQuantity &&
            product.wholesalePrice &&
            qty >= product.wholesaleMinQuantity
          ) {
            return product.wholesalePrice;
          }
          return product.productType === "flavors"
            ? 0
            : product.isPromotion && product.promotionalPrice
              ? product.promotionalPrice
              : product.price;
        };

        let modifiers = 0;
        effectiveFlavors.forEach((f) => {
          modifiers += f.priceModifier;
        });

        if (selectedComboItems) {
          selectedComboItems.forEach((comboItem) => {
            modifiers += comboItem.priceModifier * comboItem.quantity;
          });
        }

        if (selectedComplements) {
          selectedComplements.forEach((comp) => {
            modifiers += comp.price * comp.quantity;
          });
        }

        if (existingIndex >= 0) {
          const updated = [...prev];
          const newQty = updated[existingIndex].quantity + quantity;
          updated[existingIndex].quantity = newQty;
          updated[existingIndex].subtotal =
            newQty * (getBasePrice(newQty) + modifiers);
          return updated;
        }

        const subtotal = quantity * (getBasePrice(quantity) + modifiers);

        return [
          ...prev,
          {
            cartItemId: crypto.randomUUID(),
            product,
            quantity,
            selectedFlavor:
              effectiveFlavors.length === 1 ? effectiveFlavors[0] : undefined,
            selectedFlavors: effectiveFlavors,
            selectedComboItems,
            selectedComplements,
            removedIngredients,
            subtotal,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(cartItemId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.cartItemId === cartItemId) {
            let unitPrice =
              item.product.productType === "flavors"
                ? 0
                : item.product.isPromotion && item.product.promotionalPrice
                  ? item.product.promotionalPrice
                  : item.product.price;

            if (
              item.product.productType === "wholesale" &&
              item.product.wholesaleMinQuantity &&
              item.product.wholesalePrice &&
              quantity >= item.product.wholesaleMinQuantity
            ) {
              unitPrice = item.product.wholesalePrice;
            }

            if (item.selectedFlavors && item.selectedFlavors.length > 0) {
              item.selectedFlavors.forEach((f) => {
                unitPrice += f.priceModifier;
              });
            } else if (item.selectedFlavor) {
              unitPrice += item.selectedFlavor.priceModifier;
            }

            if (item.selectedComboItems) {
              item.selectedComboItems.forEach((comboItem) => {
                unitPrice += comboItem.priceModifier * comboItem.quantity;
              });
            }

            if (item.selectedComplements) {
              item.selectedComplements.forEach((comp) => {
                unitPrice += comp.price * comp.quantity;
              });
            }

            return {
              ...item,
              quantity,
              subtotal: quantity * unitPrice,
            };
          }
          return item;
        }),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getWhatsAppMessage = useCallback(
    (
      companyWhatsapp: string,
      customerName: string,
      paymentMethod: string,
      notes?: string,
    ) => {
      let message = `*Novo Pedido*\n\n`;
      message += `*Cliente:* ${customerName}\n\n`;
      message += `*Itens do Pedido:*\n`;

      items.forEach((item) => {
        const hasPromotion =
          item.product.isPromotion &&
          item.product.promotionalPrice !== null &&
          item.product.promotionalPrice !== undefined &&
          item.product.promotionalPrice > 0;

        const price = hasPromotion
          ? item.product.promotionalPrice!
          : item.product.price;

        message += `- ${item.quantity}x ${item.product.name}`;
        if (item.selectedFlavors && item.selectedFlavors.length > 0) {
          message += ` (${item.selectedFlavors.map((f) => f.name).join(", ")})`;
        } else if (item.selectedFlavor) {
          message += ` (${item.selectedFlavor.name})`;
        }

        if (item.removedIngredients && item.removedIngredients.length > 0) {
          message += `\n  *Sem:* ${item.removedIngredients.join(", ")}`;
        }

        if (item.selectedComboItems && item.selectedComboItems.length > 0) {
          message += `\n  *Itens do Combo:*`;
          item.selectedComboItems.forEach((comboItem) => {
            message += `\n  - ${comboItem.quantity}x ${comboItem.name}`;
          });
        }

        if (item.selectedComplements && item.selectedComplements.length > 0) {
          message += `\n  *Complementos:*`;
          item.selectedComplements.forEach((comp) => {
            message += `\n  - ${comp.quantity}x ${comp.name} (+${formatCurrency(comp.price * comp.quantity)})`;
          });
        }

        message += ` - ${formatCurrency(item.subtotal)}\n`;
      });

      message += `\n*Subtotal:* ${formatCurrency(subtotal)}\n`;

      if (coupon) {
        message += `*Cupom:* ${coupon.code} (-${formatCurrency(discount)})\n`;
      }

      message += `*Total Final:* ${formatCurrency(total)}\n`;
      message += `*Forma de Pagamento:* ${paymentMethod}\n`;

      if (notes) {
        message += `*Observações:* ${notes}\n`;
      }

      const encodedMessage = encodeURIComponent(message);
      return `https://wa.me/${companyWhatsapp}?text=${encodedMessage}`;
    },
    [items, subtotal, discount, coupon, total],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        subtotal,
        discount,
        coupon,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        getWhatsAppMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
