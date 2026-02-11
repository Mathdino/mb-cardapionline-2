"use client";

import { useState, useEffect } from "react";
import { Menu, LogIn, LogOut, LayoutDashboard, Shield } from "lucide-react";
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

export function HomeHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background shadow-sm transition-transform duration-300 md:hidden ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between px-4 h-16">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader className="text-left mb-6">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              {session?.user ? (
                <div className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                  <Avatar>
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <Link href="/auth/signin">
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <LogIn className="h-4 w-4" />
                    Fazer Login
                  </Button>
                </Link>
              )}

              <div className="space-y-2">
                <Link href="/" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    Início
                  </Button>
                </Link>
                <Link href="/empresa" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Painel da Empresa
                  </Button>
                </Link>
              </div>

              {session?.user && (
                <div className="pt-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold">Cardápio Online</h1>
        <div className="w-10" /> {/* Spacer for centering title */}
      </div>
    </header>
  );
}
