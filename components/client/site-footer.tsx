"use client";

import Image from "next/image";
import { useRestaurant } from "@/components/client/restaurant-context";
import { Instagram, Facebook } from "lucide-react";

export function SiteFooter() {
  const { company } = useRestaurant();

  return (
    <footer className="w-full mt-auto border-t bg-brand">
      <div className="container max-w-lg mx-auto flex items-center justify-between p-4 relative">
        {/* Lado Esquerdo: Logo */}
        <div className="relative w-15 h-15 bg-white rounded-full overflow-hidden shadow-sm shrink-0">
          <Image
            src={company?.profileImage || "/images/logo-co.png"}
            alt={company?.name || "Logo"}
            fill
            className="object-cover"
          />
        </div>

        {/* Meio: Volte Sempre */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span
            className="text-white font-bold text-lg italic tracking-widest opacity-90 drop-shadow-sm"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Volte Sempre
          </span>
        </div>

        {/* Lado Direito: Redes Sociais */}
        <div className="flex items-center gap-2">
          <a
            href="https://instagram.com/seuresutaurante" // PREENCHA O LINK DO INSTAGRAM AQUI
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-sm bg-white/10 hover:bg-white text-white hover:text-[#E4405F]"
            title="Instagram"
          >
            <Instagram className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Instagram
            </span>
          </a>

          <a
            href="https://facebook.com/seurestaurante" // PREENCHA O LINK DO FACEBOOK AQUI
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-sm bg-white/10 hover:bg-white text-white hover:text-[#1877F2]"
            title="Facebook"
          >
            <Facebook className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Facebook
            </span>
          </a>
        </div>
      </div>
      <div className="w-full bg-white p-2">
        <p className="text-xs text-black text-center font-medium">
          Desenvolvido por{" "}
          <a href="#" className="text-[#2301c0] font-bold">
            MB
          </a>{" "}
          &copy; 2026 | Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
}
