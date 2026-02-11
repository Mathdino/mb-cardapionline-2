"use client";

import { FoodLoading } from "@/components/ui/food-loading";
import { useAuth } from "@/lib/auth-context";

export default function DashboardLoading() {
  const { getCompany } = useAuth();
  const company = getCompany();

  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <FoodLoading size={100} logoSrc={company?.profileImage} />
    </div>
  );
}
