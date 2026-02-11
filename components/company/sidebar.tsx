"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Grid3X3,
  Package,
  Tag,
  TicketPercent,
  DollarSign,
  Building2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleRestaurantStatus } from "@/app/actions/company";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/empresa/dashboard" },
  { icon: ShoppingBag, label: "Pedidos", href: "/empresa/dashboard/pedidos" },
  { icon: Grid3X3, label: "Categorias", href: "/empresa/dashboard/categorias" },
  { icon: Package, label: "Produtos", href: "/empresa/dashboard/produtos" },
  {
    icon: Tag,
    label: "Promoções e Combos",
    href: "/empresa/dashboard/promocoes",
  },
  {
    icon: TicketPercent,
    label: "Cupons",
    href: "/empresa/dashboard/cupons",
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    href: "/empresa/dashboard/financeiro",
  },
  { icon: Building2, label: "Empresa", href: "/empresa/dashboard/informacoes" },
];

export function CompanySidebar() {
  const pathname = usePathname();
  const { logout, getCompany, updateCompanyData } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const company = getCompany();

  const handleLogout = () => {
    logout();
    window.location.href = "/empresa";
  };

  const handleToggleStatus = async (checked: boolean) => {
    if (!company) return;
    setIsToggling(true);
    const result = await toggleRestaurantStatus(company.id, checked);
    if (result.success && result.company) {
      updateCompanyData(result.company as any);
    }
    setIsToggling(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-foreground truncate max-w-[200px]">
          {company?.name || "Painel"}
        </h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 bottom-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <h2 className="font-bold text-foreground truncate">
            {company?.name || "Painel"}
          </h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t space-y-4">
          {/* <div className="flex items-center justify-between px-3">
            <Label htmlFor="status-mode" className="font-medium text-sm">
              {company?.isOpen ? "Loja Aberta" : "Loja Fechada"}
            </Label>
            <Switch
              id="status-mode"
              checked={company?.isOpen || false}
              onCheckedChange={handleToggleStatus}
              disabled={isToggling}
            />
          </div> */}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
