"use client";

import Image from "next/image";
import { X, Minus, Plus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import type {
  Product,
  ProductFlavor,
  SelectedComboItem,
  SelectedComplementItem,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  products: Product[]; // List of all available products for resolving combo references
}

export function ProductModal({
  product,
  isOpen,
  onClose,
  products = [],
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavors, setSelectedFlavors] = useState<ProductFlavor[]>([]);
  // GroupID -> ItemID -> Quantity
  const [comboSelections, setComboSelections] = useState<
    Record<string, Record<string, number>>
  >({});
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [complementSelections, setComplementSelections] = useState<
    Record<string, Record<string, number>>
  >({});
  const { addItem } = useCart();

  const getFlavorConfig = () => {
    if (!product?.flavors) return { min: 0, max: 0, list: [] };
    if (Array.isArray(product.flavors)) {
      return { min: 1, max: 1, list: product.flavors };
    }
    return {
      min: product.flavors.min || 0,
      max: product.flavors.max || 0,
      list: product.flavors.options || [],
    };
  };

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);
      const config = getFlavorConfig();
      // Pre-select if min > 0 and we have options?
      // Better to let user select unless we want to force default.
      // For now, empty selection.
      setSelectedFlavors([]);
      setComboSelections({});
      setComplementSelections({});
      setRemovedIngredients([]);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const hasPromotion =
    product.isPromotion &&
    product.promotionalPrice !== null &&
    product.promotionalPrice !== undefined &&
    product.promotionalPrice > 0;

  const getUnitPrice = () => {
    let price =
      product.productType === "flavors"
        ? 0
        : hasPromotion
          ? product.promotionalPrice!
          : product.price;

    if (
      product.productType === "wholesale" &&
      product.wholesaleMinQuantity &&
      product.wholesalePrice &&
      quantity >= product.wholesaleMinQuantity
    ) {
      price = product.wholesalePrice;
    }

    selectedFlavors.forEach((flavor) => {
      price += flavor.priceModifier;
    });

    if (product.productType === "combo" && product.comboConfig) {
      // Calculate price from groups
      if (product.comboConfig.groups) {
        Object.entries(comboSelections).forEach(([groupId, selections]) => {
          const group = product.comboConfig!.groups!.find(
            (g) => g.id === groupId,
          );
          if (!group) return;

          Object.entries(selections).forEach(([itemId, qty]) => {
            if (group.type === "products") {
              const selectedProduct = products.find((p) => p.id === itemId);
              if (selectedProduct) {
                // Check for price override in combo group
                let itemPrice;
                if (
                  group.productPrices &&
                  group.productPrices[itemId] !== undefined
                ) {
                  itemPrice = group.productPrices[itemId];
                } else {
                  // Use promotional price if available for the component product
                  itemPrice =
                    selectedProduct.isPromotion &&
                    selectedProduct.promotionalPrice
                      ? selectedProduct.promotionalPrice
                      : selectedProduct.price;
                }
                price += itemPrice * qty;
              }
            } else if (group.type === "custom" && group.options) {
              const option = group.options.find((o) => o.id === itemId);
              if (option) {
                price += option.priceModifier * qty;
              }
            }
          });
        });
      }
      // Legacy support for flat options
      else if (product.comboConfig.options) {
        // This part would need adaptation for the new state structure if we supported legacy fully.
        // For now, assuming new structure for 'combo' type or migrating.
        // But if we want to support legacy structure with flat state, we'd need mixed state handling.
        // Let's assume we migrated or only use new structure for now,
        // or map legacy options to a "default" group.
      }
    }

    if (product.productType === "complements" && product.complements) {
      Object.entries(complementSelections).forEach(([groupId, selections]) => {
        const group = product.complements!.find((g) => g.id === groupId);
        if (!group) return;

        Object.entries(selections).forEach(([itemId, qty]) => {
          const item = group.items.find((i) => i.id === itemId);
          if (item) {
            price += item.price * qty;
          }
        });
      });
    }

    return price;
  };

  const getTotalPrice = () => getUnitPrice() * quantity;

  const getGroupTotalSelected = (groupId: string) => {
    const selections = comboSelections[groupId] || {};
    return Object.values(selections).reduce((sum, qty) => sum + qty, 0);
  };

  const getComplementGroupTotalSelected = (groupId: string) => {
    const selections = complementSelections[groupId] || {};
    return Object.values(selections).reduce((sum, qty) => sum + qty, 0);
  };

  const canAddToCart = () => {
    if (product.productType === "flavors") {
      const { min } = getFlavorConfig();
      if (selectedFlavors.length < min) return false;
    }

    if (product.productType === "combo" && product.comboConfig) {
      if (product.comboConfig.groups) {
        // Check if all groups satisfy min/max requirements
        return product.comboConfig.groups.every((group) => {
          const total = getGroupTotalSelected(group.id);
          return total >= group.min && total <= group.max;
        });
      }
    }

    if (
      product.productType === "complements" &&
      product.complements &&
      product.complements.length > 0
    ) {
      return product.complements.every((group) => {
        const total = getComplementGroupTotalSelected(group.id);
        return total >= group.min && total <= group.max;
      });
    }

    return true;
  };

  const handleAddToCart = () => {
    let selectedComboItems: SelectedComboItem[] = [];
    let selectedComplementItems: SelectedComplementItem[] = [];

    if (product.productType === "combo" && product.comboConfig?.groups) {
      Object.entries(comboSelections).forEach(([groupId, selections]) => {
        const group = product.comboConfig!.groups!.find(
          (g) => g.id === groupId,
        );
        if (!group) return;

        Object.entries(selections).forEach(([itemId, qty]) => {
          if (qty <= 0) return;

          if (group.type === "products") {
            const selectedProduct = products.find((p) => p.id === itemId);
            if (selectedProduct) {
              let itemPrice;
              if (
                group.productPrices &&
                group.productPrices[itemId] !== undefined
              ) {
                itemPrice = group.productPrices[itemId];
              } else {
                itemPrice =
                  selectedProduct.isPromotion &&
                  selectedProduct.promotionalPrice
                    ? selectedProduct.promotionalPrice
                    : selectedProduct.price;
              }

              selectedComboItems.push({
                id: selectedProduct.id,
                name: selectedProduct.name,
                priceModifier: itemPrice,
                quantity: qty,
              });
            }
          } else if (group.type === "custom" && group.options) {
            const option = group.options.find((o) => o.id === itemId);
            if (option) {
              selectedComboItems.push({
                ...option,
                quantity: qty,
              });
            }
          }
        });
      });
    }

    if (product.productType === "complements" && product.complements) {
      Object.entries(complementSelections).forEach(([groupId, selections]) => {
        const group = product.complements!.find((g) => g.id === groupId);
        if (!group) return;

        Object.entries(selections).forEach(([itemId, qty]) => {
          if (qty <= 0) return;
          const item = group.items.find((i) => i.id === itemId);
          if (item) {
            selectedComplementItems.push({
              id: item.id,
              groupId: group.id,
              name: item.name,
              price: item.price,
              quantity: qty,
            });
          }
        });
      });
    }

    addItem(
      product,
      quantity,
      undefined,
      selectedComboItems.length > 0 ? selectedComboItems : undefined,
      removedIngredients,
      selectedFlavors,
      selectedComplementItems.length > 0 ? selectedComplementItems : undefined,
    );
    onClose();
  };

  const handleFlavorToggle = (flavor: ProductFlavor) => {
    const { max } = getFlavorConfig();
    const isSelected = selectedFlavors.some((f) => f.id === flavor.id);

    if (max === 1) {
      if (!isSelected) {
        setSelectedFlavors([flavor]);
      } else {
        // Optional: allow deselecting if min === 0?
        // For now, assuming standard radio behavior (cannot deselect the only option by clicking it)
        // unless we want to allow 0 selections.
        const { min } = getFlavorConfig();
        if (min === 0) {
          setSelectedFlavors([]);
        }
      }
    } else {
      // Multiple selection
      if (isSelected) {
        setSelectedFlavors((prev) => prev.filter((f) => f.id !== flavor.id));
      } else {
        if (selectedFlavors.length < max) {
          setSelectedFlavors((prev) => [...prev, flavor]);
        } else {
          // Optional: User feedback for max reached
          // For now, just ignore
        }
      }
    }
  };

  const handleUpdateSelection = (
    groupId: string,
    itemId: string,
    delta: number,
  ) => {
    setComboSelections((prev) => {
      const groupSelections = prev[groupId] || {};
      const currentQty = groupSelections[itemId] || 0;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        const { [itemId]: _, ...rest } = groupSelections;
        return { ...prev, [groupId]: rest };
      }

      return {
        ...prev,
        [groupId]: {
          ...groupSelections,
          [itemId]: newQty,
        },
      };
    });
  };

  const handleUpdateComplementSelection = (
    groupId: string,
    itemId: string,
    delta: number,
  ) => {
    setComplementSelections((prev) => {
      const groupSelections = prev[groupId] || {};
      const currentQty = groupSelections[itemId] || 0;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        const { [itemId]: _, ...rest } = groupSelections;
        return { ...prev, [groupId]: rest };
      }

      return {
        ...prev,
        [groupId]: {
          ...groupSelections,
          [itemId]: newQty,
        },
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-64 w-full">
          <Image
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover"
          />
          {hasPromotion && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
              -
              {Math.round(
                ((product.price - product.promotionalPrice!) / product.price) *
                  100,
              )}
              %
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Title & Description */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              {product.name}
            </h2>
            <p className="text-muted-foreground mt-2">{product.description}</p>

            {/* Price */}
            <div className="flex items-center gap-2 mt-3">
              {product.productType === "combo" && product.price === 0 ? (
                <span className="text-xl font-medium text-muted-foreground">
                  Monte seu combo
                </span>
              ) : product.isPromotion &&
                product.promotionalPrice !== null &&
                product.promotionalPrice !== undefined ? (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(product.promotionalPrice)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Complements Options - Displayed First */}
          {product.productType === "complements" && product.complements && (
            <div className="mb-6 space-y-6">
              {product.complements.map((group) => {
                const currentTotal = getComplementGroupTotalSelected(group.id);
                const isMaxReached = currentTotal >= group.max;

                return (
                  <div key={group.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {group.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {group.max >= 999
                            ? group.min > 0
                              ? `Escolha pelo menos ${group.min} opções`
                              : "Escolha à vontade"
                            : `Escolha ${
                                group.min === group.max
                                  ? group.min
                                  : `${group.min} a ${group.max}`
                              } opções`}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium ${currentTotal < group.min ? "text-destructive" : "text-green-600"}`}
                      >
                        {group.max >= 999
                          ? currentTotal
                          : `${currentTotal}/${group.max}`}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const currentQty =
                          complementSelections[group.id]?.[item.id] || 0;
                        const itemMax = 999; // No limit per item
                        const canIncrease =
                          !isMaxReached && currentQty < itemMax;
                        const canDecrease = currentQty > 0;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20"
                          >
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-sm font-bold text-primary">
                                +{formatCurrency(item.price)}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 bg-background rounded-lg border p-1">
                              <button
                                onClick={() =>
                                  handleUpdateComplementSelection(
                                    group.id,
                                    item.id,
                                    -1,
                                  )
                                }
                                disabled={!canDecrease}
                                className="p-1 rounded-md hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-4 text-center text-sm font-medium">
                                {currentQty}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateComplementSelection(
                                    group.id,
                                    item.id,
                                    1,
                                  )
                                }
                                disabled={!canIncrease}
                                className="p-1 rounded-md hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Wholesale Info */}
          {product.productType === "wholesale" &&
            product.wholesaleMinQuantity &&
            product.wholesalePrice && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-sm mb-1">
                  Preço de Atacado Disponível!
                </p>
                <p className="text-sm">
                  Compre {product.wholesaleMinQuantity} ou mais unidades e pague
                  apenas {formatCurrency(product.wholesalePrice)} cada.
                </p>
              </div>
            )}

          {/* Ingredients Selection */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">
                Ingredientes
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Toque para remover ingredientes
              </p>
              <div className="grid grid-cols-2 gap-3">
                {product.ingredients.map((ingredient) => {
                  const isRemoved = removedIngredients.includes(ingredient);
                  return (
                    <button
                      key={ingredient}
                      onClick={() => {
                        if (isRemoved) {
                          setRemovedIngredients((prev) =>
                            prev.filter((i) => i !== ingredient),
                          );
                        } else {
                          setRemovedIngredients((prev) => [
                            ...prev,
                            ingredient,
                          ]);
                        }
                      }}
                      className={`
                        relative flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200
                        ${
                          !isRemoved
                            ? "border-primary/50 bg-primary/5 shadow-sm"
                            : "border-transparent bg-secondary/50 opacity-70"
                        }
                      `}
                    >
                      <span
                        className={`text-sm font-medium ${isRemoved ? "text-muted-foreground line-through decoration-destructive/40" : "text-foreground"}`}
                      >
                        {ingredient}
                      </span>
                      <div
                        className={`
                        flex items-center justify-center w-5 h-5 rounded-full border transition-colors
                        ${
                          !isRemoved
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-transparent"
                        }
                      `}
                      >
                        {!isRemoved && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flavors Selection */}
          {product.productType === "flavors" && product.flavors && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-foreground">
                  Escolha o sabor
                </h3>
                {(() => {
                  const { min, max } = getFlavorConfig();
                  return (
                    <span className="text-xs text-muted-foreground">
                      {max > 1
                        ? `Selecione ${min === max ? min : `${min} a ${max}`} (${selectedFlavors.length}/${max})`
                        : "Selecione 1 opção"}
                    </span>
                  );
                })()}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {getFlavorConfig().list.map((flavor) => {
                  const isSelected = selectedFlavors.some(
                    (f) => f.id === flavor.id,
                  );
                  const { max } = getFlavorConfig();
                  const isMaxReached = selectedFlavors.length >= max;
                  const isDisabled = !isSelected && isMaxReached && max > 1;

                  return (
                    <button
                      key={flavor.id}
                      onClick={() => handleFlavorToggle(flavor)}
                      disabled={isDisabled}
                      className={`
                      relative overflow-hidden flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left
                      ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : isDisabled
                            ? "border-transparent bg-secondary/30 opacity-50 cursor-not-allowed"
                            : "border-transparent bg-secondary/50 hover:bg-secondary hover:border-primary/20"
                      }
                    `}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {flavor.name}
                        </p>
                        {flavor.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {flavor.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {flavor.priceModifier !== 0 && (
                          <span
                            className={`text-sm font-bold px-2 py-1 rounded-md ${
                              flavor.priceModifier > 0
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                          >
                            {flavor.priceModifier > 0 ? "+" : ""}
                            {formatCurrency(flavor.priceModifier)}
                          </span>
                        )}
                        <div
                          className={`
                          flex items-center justify-center w-5 h-5 rounded-full border transition-colors
                          ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 bg-transparent"
                          }
                        `}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Combo Options (New Group Structure) */}
          {product.productType === "combo" && product.comboConfig?.groups && (
            <div className="mt-6 space-y-6">
              {[...product.comboConfig.groups].reverse().map((group) => {
                const currentTotal = getGroupTotalSelected(group.id);
                const isMaxReached = currentTotal >= group.max;

                return (
                  <div key={group.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {group.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {group.max >= 999
                            ? group.min > 0
                              ? `Escolha pelo menos ${group.min} opções`
                              : "Escolha à vontade"
                            : `Escolha ${
                                group.min === group.max
                                  ? group.min
                                  : `${group.min} a ${group.max}`
                              } opções`}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium ${currentTotal < group.min ? "text-destructive" : "text-green-600"}`}
                      >
                        {group.max >= 999
                          ? currentTotal
                          : `${currentTotal}/${group.max}`}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {group.type === "products" && group.productIds && (
                        <>
                          {group.productIds.map((productId) => {
                            const productItem = products.find(
                              (p) => p.id === productId,
                            );
                            if (!productItem) return null;

                            let itemPrice;
                            if (
                              group.productPrices &&
                              group.productPrices[productId] !== undefined
                            ) {
                              itemPrice = group.productPrices[productId];
                            } else {
                              itemPrice =
                                productItem.isPromotion &&
                                productItem.promotionalPrice
                                  ? productItem.promotionalPrice
                                  : productItem.price;
                            }

                            const qty =
                              comboSelections[group.id]?.[productId] || 0;

                            return (
                              <div
                                key={productId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-secondary/20"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {productItem.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(itemPrice)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() =>
                                      handleUpdateSelection(
                                        group.id,
                                        productId,
                                        -1,
                                      )
                                    }
                                    disabled={qty <= 0}
                                    className="p-1 rounded-full hover:bg-secondary disabled:opacity-30"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-4 text-center text-sm font-medium">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleUpdateSelection(
                                        group.id,
                                        productId,
                                        1,
                                      )
                                    }
                                    disabled={isMaxReached}
                                    className="p-1 rounded-full hover:bg-secondary disabled:opacity-30"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {group.type === "custom" && group.options && (
                        <>
                          {group.options.map((option) => {
                            const qty =
                              comboSelections[group.id]?.[option.id] || 0;
                            return (
                              <div
                                key={option.id}
                                className="flex items-center justify-between p-3 border rounded-lg bg-secondary/20"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {option.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    + {formatCurrency(option.priceModifier)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() =>
                                      handleUpdateSelection(
                                        group.id,
                                        option.id,
                                        -1,
                                      )
                                    }
                                    disabled={qty <= 0}
                                    className="p-1 rounded-full hover:bg-secondary disabled:opacity-30"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-4 text-center text-sm font-medium">
                                    {qty}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleUpdateSelection(
                                        group.id,
                                        option.id,
                                        1,
                                      )
                                    }
                                    disabled={isMaxReached}
                                    className="p-1 rounded-full hover:bg-secondary disabled:opacity-30"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Complements Options moved to top */}
        </div>
      </div>

      {/* Footer - Add to Cart */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex items-center justify-between mb-4">
          {/* Quantity Selector */}
          {product.productType === "combo" ? (
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-foreground">
                1 unidade
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="w-8 text-center font-semibold text-lg">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Total */}
          <span className="text-xl font-bold text-foreground">
            {getTotalPrice() > 0
              ? formatCurrency(getTotalPrice())
              : "A calcular"}
          </span>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={!canAddToCart()}
          className="w-full h-12 text-lg"
        >
          Adicionar ao carrinho
        </Button>
      </div>
    </div>
  );
}
