export const PLANS = {
  FREE:    { name: "Free",    reservationsPerMonth: 50,  maxUsers: 1,  whatsapp: false, price: 0 },
  PRO:     { name: "Pro",     reservationsPerMonth: 500, maxUsers: 5,  whatsapp: true,  price: 97 },
  PREMIUM: { name: "Premium", reservationsPerMonth: -1,  maxUsers: -1, whatsapp: true,  price: 197 },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: string) {
  return PLANS[plan as PlanKey] ?? PLANS.FREE;
}

export function isReservationLimitReached(restaurant: { plan: string; reservationsThisMonth: number }): boolean {
  const limits = getPlanLimits(restaurant.plan);
  if (limits.reservationsPerMonth === -1) return false; // unlimited
  return restaurant.reservationsThisMonth >= limits.reservationsPerMonth;
}
