"use client";

import React from "react";
import Image from "next/image";
import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface FoodLoadingProps {
  logoSrc?: string;
  size?: number;
  className?: string;
}

export function FoodLoading({
  logoSrc = "/images/logo-co.png",
  size = 120,
  className,
}: FoodLoadingProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Spinning Outer Ring with Food Theme Color */}
      <div
        className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand border-r-brand/30 animate-spin"
        style={{ animationDuration: "1.5s" }}
      />

      {/* Inner Pulsing Ring */}
      <div className="absolute inset-2 rounded-full border-2 border-brand/10 animate-pulse" />

      {/* Center Content - Logo */}
      <div className="relative z-10 h-2/3 w-2/3 rounded-full bg-white p-2 shadow-sm flex items-center justify-center overflow-hidden">
        {logoSrc ? (
          <div className="relative w-full h-full">
            <Image
              src={logoSrc}
              alt="Loading..."
              fill
              className="object-contain p-1"
            />
          </div>
        ) : (
          <Utensils className="w-1/2 h-1/2 text-brand" />
        )}
      </div>
    </div>
  );
}
