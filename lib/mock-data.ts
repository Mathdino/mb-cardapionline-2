import type {
  Company,
  Category,
  Product,
  Order,
  User,
  Promotion,
} from "./types";

export const mockCompanies: Company[] = [
  {
    id: "1",
    name: "Quero Mais Salgaderia",
    slug: "quero-mais-salgaderia",
    description:
      "Os melhores salgados da cidade! Tradição e sabor em cada mordida.",
    profileImage: "/images/logo-salgaderia.jpg",
    bannerImage: "/images/banner-salgaderia.jpg",
    phone: ["(11) 99999-9999", "(11) 3333-3333"],
    whatsapp: "5511999999999",
    minimumOrder: 19.99,
    address: {
      cep: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    businessHours: [
      {
        dayOfWeek: 0,
        dayName: "Domingo",
        isOpen: false,
        openTime: "",
        closeTime: "",
      },
      {
        dayOfWeek: 1,
        dayName: "Segunda",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        dayOfWeek: 2,
        dayName: "Terça",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        dayOfWeek: 3,
        dayName: "Quarta",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        dayOfWeek: 4,
        dayName: "Quinta",
        isOpen: true,
        openTime: "08:00",
        closeTime: "18:00",
      },
      {
        dayOfWeek: 5,
        dayName: "Sexta",
        isOpen: true,
        openTime: "08:00",
        closeTime: "20:00",
      },
      {
        dayOfWeek: 6,
        dayName: "Sábado",
        isOpen: true,
        openTime: "09:00",
        closeTime: "15:00",
      },
    ],
    paymentMethods: ["cash", "credit", "debit", "pix", "meal_voucher"],
    isOpen: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
  },
];

export const mockCategories: Category[] = [
  { id: "1", companyId: "1", name: "Agendamento", order: 1 },
  { id: "2", companyId: "1", name: "Novidade Mini Pastel !!!", order: 2 },
  { id: "3", companyId: "1", name: "Combo Salgados", order: 3 },
  { id: "4", companyId: "1", name: "Salgados Avulsos", order: 4 },
  { id: "5", companyId: "1", name: "Bebidas", order: 5 },
];

export const mockProducts: Product[] = [
  // Mini Pastel Category
  {
    id: "1",
    companyId: "1",
    categoryId: "2",
    name: "100 Mini Pastel",
    description:
      "Mini pastel de 12 a 15 gramas. Perfeito para festas e eventos!",
    image: "/images/mini-pastel-100.jpg",
    price: 95.0,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
  {
    id: "2",
    companyId: "1",
    categoryId: "2",
    name: "12 Mini Pastel",
    description: "Mini pastel de 12 a 15 gramas.",
    image: "/images/mini-pastel-12.jpg",
    price: 15.0,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
  {
    id: "3",
    companyId: "1",
    categoryId: "2",
    name: "20 Mini Pastel",
    description: "Mini pastel de 12 a 15 gramas.",
    image: "/images/mini-pastel-20.jpg",
    price: 22.0,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
  {
    id: "4",
    companyId: "1",
    categoryId: "2",
    name: "30 Mini Pastel",
    description: "Mini pastel de 12 a 15 gramas.",
    image: "/images/mini-pastel-30.jpg",
    price: 33.0,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
  // Combo Category
  {
    id: "5",
    companyId: "1",
    categoryId: "3",
    name: "Combo 40 Salgados",
    description: "Escolha 40 salgados variados para sua festa!",
    image: "/images/combo-40.jpg",
    price: 65.0,
    isPromotion: false,
    productType: "combo",
    comboConfig: {
      maxItems: 40,
      availableProducts: ["8", "9", "10", "11"],
    },
    isAvailable: true,
  },
  {
    id: "6",
    companyId: "1",
    categoryId: "3",
    name: "Combo 100 Salgados",
    description: "Escolha 100 salgados variados para grandes eventos!",
    image: "/images/combo-100.jpg",
    price: 150.0,
    isPromotion: false,
    productType: "combo",
    comboConfig: {
      maxItems: 100,
      availableProducts: ["8", "9", "10", "11"],
    },
    isAvailable: true,
  },
  // Pizza with flavors
  {
    id: "7",
    companyId: "1",
    categoryId: "4",
    name: "Pizza Grande",
    description: "Pizza grande com diversos sabores disponíveis.",
    image: "/images/pizza.jpg",
    price: 45.0,
    isPromotion: false,
    productType: "flavors",
    flavors: [
      { id: "f1", name: "Calabresa", priceModifier: 0 },
      { id: "f2", name: "Mussarela", priceModifier: 0 },
      { id: "f3", name: "Frango com Catupiry", priceModifier: 5 },
      { id: "f4", name: "Portuguesa", priceModifier: 8 },
      { id: "f5", name: "4 Queijos", priceModifier: 10 },
    ],
    isAvailable: true,
  },
  // Individual items for combos
  {
    id: "8",
    companyId: "1",
    categoryId: "4",
    name: "Coxinha",
    description: "Coxinha de frango cremosa.",
    image: "/images/coxinha.jpg",
    price: 5.0,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
  {
    id: "9",
    companyId: "1",
    categoryId: "4",
    name: "Esfiha",
    description: "Esfiha de carne temperada.",
    image: "/images/esfiha.jpg",
    price: 4.5,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
  {
    id: "10",
    companyId: "1",
    categoryId: "4",
    name: "Bolinha de Queijo",
    description: "Bolinha de queijo crocante.",
    image: "/images/bolinha-queijo.jpg",
    price: 4.0,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
  {
    id: "11",
    companyId: "1",
    categoryId: "4",
    name: "Kibe",
    description: "Kibe frito tradicional.",
    image: "/images/kibe.jpg",
    price: 5.5,
    isPromotion: true,
    promotionalPrice: 4.5,
    productType: "simple",
    isAvailable: true,
  },
  // Drinks
  {
    id: "12",
    companyId: "1",
    categoryId: "5",
    name: "Refrigerante Lata",
    description: "Coca-Cola, Guaraná ou Fanta.",
    image: "/images/refrigerante.jpg",
    price: 6.0,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
  {
    id: "13",
    companyId: "1",
    categoryId: "5",
    name: "Suco Natural",
    description: "Suco natural de laranja ou limão.",
    image: "/images/suco.jpg",
    price: 8.0,
    isPromotion: false,
    productType: "simple",
    isAvailable: true,
  },
];

export const mockOrders: Order[] = [
  {
    id: "1",
    companyId: "1",
    customerName: "João Silva",
    customerPhone: "11999887766",
    items: [
      {
        productId: "1",
        productName: "100 Mini Pastel",
        quantity: 1,
        unitPrice: 95.0,
        subtotal: 95.0,
      },
      {
        productId: "12",
        productName: "Refrigerante Lata",
        quantity: 2,
        unitPrice: 6.0,
        subtotal: 12.0,
      },
    ],
    total: 107.0,
    status: "pending",
    paymentMethod: "pix",
    createdAt: new Date(),
  },
  {
    id: "2",
    companyId: "1",
    customerName: "Maria Santos",
    customerPhone: "11988776655",
    items: [
      {
        productId: "5",
        productName: "Combo 40 Salgados",
        quantity: 1,
        unitPrice: 65.0,
        subtotal: 65.0,
      },
    ],
    total: 65.0,
    status: "confirmed",
    paymentMethod: "credit",
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: "3",
    companyId: "1",
    customerName: "Carlos Oliveira",
    customerPhone: "11977665544",
    items: [
      {
        productId: "8",
        productName: "Coxinha",
        quantity: 10,
        unitPrice: 5.0,
        subtotal: 50.0,
      },
      {
        productId: "9",
        productName: "Esfiha",
        quantity: 5,
        unitPrice: 4.5,
        subtotal: 22.5,
      },
    ],
    total: 72.5,
    status: "delivered",
    paymentMethod: "cash",
    createdAt: new Date(Date.now() - 86400000),
  },
];

export const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@sistema.com",
    role: "admin",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    email: "queromaissalgaderia@email.com",
    role: "company",
    companyId: "1",
    createdAt: new Date("2024-01-15"),
  },
];

export const mockPromotions: Promotion[] = [
  {
    id: "1",
    companyId: "1",
    productId: "11",
    originalPrice: 5.5,
    promotionalPrice: 4.5,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    isActive: true,
  },
];

// Helper functions
export function getCompanyBySlug(slug: string): Company | undefined {
  return mockCompanies.find((c) => c.slug === slug);
}

export function getCategoriesByCompany(companyId: string): Category[] {
  return mockCategories
    .filter((c) => c.companyId === companyId)
    .sort((a, b) => a.order - b.order);
}

export function getProductsByCategory(categoryId: string): Product[] {
  return mockProducts.filter((p) => p.categoryId === categoryId);
}

export function getProductsByCompany(companyId: string): Product[] {
  return mockProducts.filter((p) => p.companyId === companyId);
}

export function getOrdersByCompany(companyId: string): Order[] {
  return mockOrders.filter((o) => o.companyId === companyId);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  pix: "PIX",
  meal_voucher: "Vale Refeição",
};

export const defaultBusinessHours = [
  {
    dayOfWeek: 0,
    dayName: "Domingo",
    isOpen: false,
    openTime: "18:00",
    closeTime: "23:00",
  },
  {
    dayOfWeek: 1,
    dayName: "Segunda",
    isOpen: true,
    openTime: "18:00",
    closeTime: "23:00",
  },
  {
    dayOfWeek: 2,
    dayName: "Terça",
    isOpen: true,
    openTime: "18:00",
    closeTime: "23:00",
  },
  {
    dayOfWeek: 3,
    dayName: "Quarta",
    isOpen: true,
    openTime: "18:00",
    closeTime: "23:00",
  },
  {
    dayOfWeek: 4,
    dayName: "Quinta",
    isOpen: true,
    openTime: "18:00",
    closeTime: "23:00",
  },
  {
    dayOfWeek: 5,
    dayName: "Sexta",
    isOpen: true,
    openTime: "18:00",
    closeTime: "23:00",
  },
  {
    dayOfWeek: 6,
    dayName: "Sábado",
    isOpen: true,
    openTime: "18:00",
    closeTime: "23:00",
  },
];

export const orderStatusLabels: Record<string, string> = {
  pending: "Pendente",
  preparing: "Preparando",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const orderStatusColors: Record<string, string> = {
  pending: "bg-yellow-500 text-black-100",
  preparing: "bg-blue-500 text-blue-100",
  delivered: "bg-green-500 text-green-100",
  cancelled: "bg-red-500 text-red-100",
};
