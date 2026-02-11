"use client";

import { createContext, useContext, ReactNode } from "react";
import { Company } from "@/lib/types";

interface RestaurantContextType {
  company: Company | null;
}

const RestaurantContext = createContext<RestaurantContextType>({
  company: null,
});

export function RestaurantProvider({
  company,
  children,
}: {
  company: Company | null;
  children: ReactNode;
}) {
  return (
    <RestaurantContext.Provider value={{ company }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  return useContext(RestaurantContext);
}
