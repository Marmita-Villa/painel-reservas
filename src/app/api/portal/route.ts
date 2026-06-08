import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

// POST /api/portal — redirect to Stripe Customer Portal
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = session.user as any;
  const restaurantId = user.restaurantId;
  if (!restaurantId) return NextResponse.json({ error: "Sem restaurante" }, { status: 400 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { stripeCustomerId: true } as any,
  });

  // If no stripeCustomerId stored, search by metadata
  let customerId: string | null = (restaurant as any)?.stripeCustomerId ?? null;

  if (!customerId) {
    // Try to find customer by metadata
    const customers = await stripe.customers.search({
      query: `metadata["restaurantId"]:"${restaurantId}"`,
      limit: 1,
    });
    customerId = customers.data[0]?.id ?? null;
  }

  if (!customerId) {
    return NextResponse.json({ error: "Nenhuma assinatura ativa encontrada. Assine um plano primeiro." }, { status: 404 });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/upgrade`,
  });

  return NextResponse.json({ url: portalSession.url });
}
