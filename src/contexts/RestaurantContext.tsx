"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface Restaurant { id: string; name: string; slug: string; plan?: string; }

interface RestaurantContextType {
  restaurants: Restaurant[];
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (id: string | null) => void;
  effectiveRestaurantId: string | undefined;
  restaurant: Restaurant | null;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurants: [],
  selectedRestaurantId: null,
  setSelectedRestaurantId: () => {},
  effectiveRestaurantId: undefined,
  restaurant: null,
});

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userRestaurantId = (session?.user as any)?.restaurantId;
  const isMasterSuper = role === "MASTER_SUPER";

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
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

  // Fetch current restaurant (with plan info)
  const effectiveId = isMasterSuper ? (selectedRestaurantId ?? undefined) : userRestaurantId;
  useEffect(() => {
    if (!effectiveId) return;
    fetch(`/api/restaurants/${effectiveId}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setCurrentRestaurant(data); })
      .catch(() => {});
  }, [effectiveId]);

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
    <RestaurantContext.Provider value={{ restaurants, selectedRestaurantId, setSelectedRestaurantId, effectiveRestaurantId, restaurant: currentRestaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => useContext(RestaurantContext);
