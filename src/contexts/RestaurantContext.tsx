"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface Restaurant { id: string; name: string; slug: string; }

interface RestaurantContextType {
  restaurants: Restaurant[];
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (id: string | null) => void;
  effectiveRestaurantId: string | undefined;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurants: [],
  selectedRestaurantId: null,
  setSelectedRestaurantId: () => {},
  effectiveRestaurantId: undefined,
});

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userRestaurantId = (session?.user as any)?.restaurantId;
  const isMasterSuper = role === "MASTER_SUPER";

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedRestaurantId") ?? null;
    }
    return null;
  });

  useEffect(() => {
    if (!isMasterSuper) return;
    fetch("/api/restaurants")
      .then(r => r.json())
      .then(data => setRestaurants(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isMasterSuper]);

  const setSelectedRestaurantId = (id: string | null) => {
    setSelectedRestaurantIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem("selectedRestaurantId", id);
      else localStorage.removeItem("selectedRestaurantId");
    }
  };

  const effectiveRestaurantId = isMasterSuper
    ? (selectedRestaurantId ?? undefined)
    : userRestaurantId;

  return (
    <RestaurantContext.Provider value={{ restaurants, selectedRestaurantId, setSelectedRestaurantId, effectiveRestaurantId }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => useContext(RestaurantContext);
