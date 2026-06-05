"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function OnboardingCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "authenticated") return;
    const user = session?.user as any;
    if (!user?.restaurantId) return;
    if (user.role === "MASTER_SUPER") return;
    if (pathname.startsWith("/onboarding")) return;

    const done = localStorage.getItem(`onboarding_done_${user.restaurantId}`);
    if (!done) {
      router.replace("/onboarding");
    }
  }, [status, session, router, pathname]);

  return null;
}
