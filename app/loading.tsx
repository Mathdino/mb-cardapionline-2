"use client";

import { FoodLoading } from "@/components/ui/food-loading";
import { useRestaurant } from "@/components/client/restaurant-context";

export default function Loading() {
  const { company } = useRestaurant();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <FoodLoading size={100} logoSrc={company?.profileImage} />
    </div>
  );
}
