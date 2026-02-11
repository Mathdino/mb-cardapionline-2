"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight, Timer } from "lucide-react";
import type { Company } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface RestaurantHeaderProps {
  company: Company;
}

export function RestaurantHeader({ company }: RestaurantHeaderProps) {
  const today = new Date().getDay();
  const todayHours = Array.isArray(company.businessHours)
    ? company.businessHours.find((h) => h.dayOfWeek === today)
    : undefined;

  const isCurrentlyOpen = () => {
    if (!company.isOpen) return false;
    if (!todayHours?.isOpen) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // Handle cases where closing time is on the next day (e.g. 18:00 - 02:00)
    if (todayHours.openTime <= todayHours.closeTime) {
      return (
        currentTime >= todayHours.openTime &&
        currentTime <= todayHours.closeTime
      );
    } else {
      // Crosses midnight
      return (
        currentTime >= todayHours.openTime ||
        currentTime <= todayHours.closeTime
      );
    }
  };

  return (
    <header className="bg-background">
      {/* Banner */}
      <div className="relative h-32 w-full">
        <Image
          src={company.bannerImage || "/placeholder.svg"}
          alt={`Banner ${company.name}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Company Info */}
      <div className="relative px-4 pb-4">
        {/* Profile Image */}
        <div className="absolute -top-10 left-4">
          <div className="relative h-20 w-20 rounded-full border-4 border-background overflow-hidden bg-background">
            <Image
              src={company.profileImage || "/placeholder.svg"}
              alt={company.name}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Company Name & Status */}
        <div className="pt-12">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">
              {company.name}
            </h1>
            <span
              suppressHydrationWarning
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isCurrentlyOpen()
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isCurrentlyOpen() ? "Aberto" : "Fechado"}
            </span>
          </div>

          {/* Quick Info */}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            {todayHours?.isOpen && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span suppressHydrationWarning>
                  {todayHours.openTime} - {todayHours.closeTime}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span>Min. {formatCurrency(company.minimumOrder)}</span>
            </div>
          </div>

          {/* View Details Link */}
          <Link
            href={`/${company.slug}/info`}
            className="flex items-center gap-1 mt-3 text-sm text-primary font-medium hover:underline"
          >
            Ver mais
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
