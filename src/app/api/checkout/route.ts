import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
});

const PRICE_IDS: Record<string, string> = {
  PRO:     process.env.STRIPE_PRICE_PRO     ?? "",
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM ?? "",
};

// POST /api/checkout — create Stripe checkout session
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = session.user as any;
  const restaurantId = user.restaurantId;
  if (!restaurantId) return NextResponse.json({ error: "Sem restaurante" }, { status: 400 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe não configurado" }, { status: 503 });
  }

  const { plan } = await req.json();
  const priceId = PRICE_IDS[plan];
  if (!priceId) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/upgrade/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/upgrade`,
      metadata: { restaurantId, plan },
      subscription_data: {
        metadata: { restaurantId, plan },
      },
    });
    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("[Stripe checkout error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
