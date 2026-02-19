// Company/Restaurant Types
export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string;
  profileImage: string;
  bannerImage: string;
  phone: string[];
  whatsapp: string;
  minimumOrder: number;
  address: Address;
  businessHours: BusinessHours[];
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  allowsDelivery: boolean;
  allowsPickup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export type PaymentMethod =
  | "cash"
  | "credit"
  | "debit"
  | "pix"
  | "meal_voucher";

// Category Types
export interface Category {
  id: string;
  companyId: string;
  name: string;
  order: number;
  isExpanded?: boolean;
}

// Product Types
export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  promotionalPrice?: number;
  isPromotion: boolean;
  productType: "simple" | "flavors" | "combo" | "wholesale" | "complements";
  flavors?:
    | ProductFlavor[]
    | { min: number; max: number; options: ProductFlavor[] };
  complements?: ComplementGroup[];
  comboConfig?: ComboConfig;
  ingredients?: string[];
  wholesaleMinQuantity?: number;
  wholesalePrice?: number;
  isAvailable: boolean;
  preparationTime?: number;
  preparationTimeUnit?: "hours" | "days";
}

export interface ProductFlavor {
  id: string;
  name: string;
  description?: string;
  priceModifier: number; // Can be positive or negative
}

export interface ComboConfig {
  maxItems: number;
  options: ComboItem[];
  groups?: ComboGroup[];
}

export interface ComboGroup {
  id: string;
  title: string;
  type: "products" | "custom";
  min: number;
  max: number;
  productIds?: string[];
  productPrices?: Record<string, number>;
  options?: ComboItem[];
}

export interface ComboItem {
  id: string;
  name: string;
  priceModifier: number;
}

export interface ComplementGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  items: ComplementItem[];
}

export interface ComplementItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

// Order Types
export interface Order {
  id: string;
  companyId: string;
  customerName: string;
  customerPhone: string;
  customerCpf?: string;
  deliveryAddress?: Address;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: Date;
  discount?: number;
  couponId?: string;
  scheduledPickupTime?: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  selectedFlavor?: string; // Kept for backward compatibility
  selectedFlavors?: string[]; // New field for multiple flavors
  comboItems?: string[];
  selectedComplements?: SelectedComplementItem[];
  removedIngredients?: string[];
  subtotal: number;
}

export type OrderStatus = "pending" | "preparing" | "delivered" | "cancelled";

// Cart Types
export interface SelectedComboItem extends ComboItem {
  quantity: number;
}

export interface SelectedComplementItem {
  id: string;
  groupId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedFlavor?: ProductFlavor; // Kept for backward compatibility
  selectedFlavors?: ProductFlavor[]; // New field for multiple flavors
  selectedComboItems?: SelectedComboItem[];
  selectedComplements?: SelectedComplementItem[];
  removedIngredients?: string[];
  subtotal: number;
}

export interface Cart {
  companyId: string;
  items: CartItem[];
  total: number;
}

// User Types
export interface User {
  id: string;
  email: string | null;
  name?: string | null;
  role: "admin" | "company" | "customer";
  companyId?: string | null;
  phone?: string | null;
  cpf?: string | null;
  address?: Address | null;
  image?: string | null;
  createdAt: Date;
}

// Promotion Types
export interface Promotion {
  id: string;
  companyId: string;
  productId: string;
  originalPrice: number;
  promotionalPrice: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Coupon {
  id: string;
  companyId: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  startDate?: Date | null;
  expirationDate?: Date | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Financial Types
export interface FinancialSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
}
