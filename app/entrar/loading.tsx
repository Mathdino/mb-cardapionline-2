"use client";

import { FoodLoading } from "@/components/ui/food-loading";
import { useRestaurant } from "@/components/client/restaurant-context";

export default function Loading() {
  const { company } = useRestaurant();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <FoodLoading size={100} logoSrc={company?.profileImage} />
    </div>
  );
}
