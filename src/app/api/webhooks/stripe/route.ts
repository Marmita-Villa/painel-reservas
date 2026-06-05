import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !sig) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[Stripe webhook] Invalid signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const restaurantId = session.metadata?.restaurantId;
    const plan = session.metadata?.plan;

    if (restaurantId && plan && ["PRO", "PREMIUM"].includes(plan)) {
      // Set plan + expiry (1 month from now)
      const planExpiresAt = new Date();
      planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);

      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { plan, planExpiresAt },
      });

      console.log(`[Stripe webhook] Restaurant ${restaurantId} upgraded to ${plan}`);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const restaurantId = sub.metadata?.restaurantId;
    if (restaurantId) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { plan: "FREE", planExpiresAt: null },
      });
      console.log(`[Stripe webhook] Restaurant ${restaurantId} downgraded to FREE`);
    }
  }

  return NextResponse.json({ received: true });
}
