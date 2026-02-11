"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Menu,
  Search,
  X,
  User,
  ShoppingBag,
  LogIn,
  Info,
  LogOut,
  LayoutDashboard,
  Store,
} from "lucide-react";
import type { Company } from "@/lib/types";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ScrollHeaderProps {
  company?: Company;
  onSearch?: (query: string) => void;
  alwaysVisible?: boolean;
}

export function ScrollHeader({
  company,
  onSearch,
  alwaysVisible = false,
}: ScrollHeaderProps) {
  const [isVisible, setIsVisible] = useState(alwaysVisible);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setIsMounted(true);
    if (alwaysVisible) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [alwaysVisible]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const toggleSearch = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchQuery("");
      if (onSearch) {
        onSearch("");
      }
    } else {
      setIsSearchActive(true);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background shadow-sm transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">
        {isSearchActive ? (
          <div className="flex items-center w-full gap-2">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 h-10 px-4 rounded-full bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
              autoFocus
            />
            <button
              onClick={toggleSearch}
              className="p-2 hover:bg-secondary rounded-full"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              {isMounted ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader className="mb-6">
                      <SheetTitle className="flex items-center gap-2">
                        {session?.user ? (
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={session.user.image || ""} />
                              <AvatarFallback>
                                {session.user.name?.charAt(0) || "C"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="text-sm font-medium">
                                {session.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Bem-vindo(a)
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-5 w-5" />
                            <span>Olá, visitante</span>
                          </div>
                        )}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-2">
                      {session?.user ? (
                        <>
                          <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-lg transition-colors"
                          >
                            <Store className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Loja</span>
                          </Link>

                          <Link
                            href="/perfil"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-lg transition-colors"
                          >
                            <User className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Meu Perfil</span>
                          </Link>

                          <Link
                            href="/historico"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-lg transition-colors"
                          >
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">
                              Histórico de Compras
                            </span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/entrar"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-lg transition-colors"
                        >
                          <LogIn className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">Entrar</span>
                        </Link>
                      )}

                      {company && (
                        <Link
                          href={`/${company.slug}/info`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-lg transition-colors"
                        >
                          <Info className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium">Sobre nós</span>
                        </Link>
                      )}

                      <Link
                        href="/empresa"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Painel da Empresa</span>
                      </Link>

                      {session?.user && (
                        <button
                          onClick={() => signOut()}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 rounded-lg transition-colors mt-2"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">Sair</span>
                        </button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              )}

              {company && (
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border">
                    <Image
                      src={company.profileImage || "/placeholder.svg"}
                      alt={company.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h1 className="font-bold text-sm truncate max-w-[150px]">
                    {company.name}
                  </h1>
                </div>
              )}
            </div>
            {onSearch && (
              <button
                onClick={toggleSearch}
                className="bg-brand text-white p-2 rounded-full hover:opacity-90 transition-colors shadow-sm"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
