import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

function nextMonthExpiry() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
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

  // ── Primeira assinatura concluída ──
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const restaurantId = session.metadata?.restaurantId;
    const plan = session.metadata?.plan;

    if (restaurantId && plan && ["PRO", "PREMIUM"].includes(plan)) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { plan, planExpiresAt: nextMonthExpiry() },
      });
      console.log(`[Stripe] Restaurant ${restaurantId} → ${plan}`);

      // Persist stripeCustomerId for portal use
      if (session.customer) {
        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: { stripeCustomerId: String(session.customer) } as any,
        }).catch(() => {}); // field may not exist yet — no-op
      }
    }
  }

  // ── Renovação mensal ──
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
    const sub = invoice.subscription
      ? await stripe.subscriptions.retrieve(String(invoice.subscription))
      : null;

    const restaurantId = sub?.metadata?.restaurantId;
    const plan = sub?.metadata?.plan;

    if (restaurantId && plan && ["PRO", "PREMIUM"].includes(plan)) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { plan, planExpiresAt: nextMonthExpiry() },
      });
      console.log(`[Stripe] Renewal: restaurant ${restaurantId} → ${plan} until ${nextMonthExpiry().toISOString()}`);
    }
  }

  // ── Cancelamento / inadimplência ──
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const restaurantId = sub.metadata?.restaurantId;
    if (restaurantId) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { plan: "FREE", planExpiresAt: null },
      });
      console.log(`[Stripe] Restaurant ${restaurantId} → FREE (subscription cancelled)`);
    }
  }

  // ── Pagamento falhou ──
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
    const sub = invoice.subscription
      ? await stripe.subscriptions.retrieve(String(invoice.subscription))
      : null;
    const restaurantId = sub?.metadata?.restaurantId;
    if (restaurantId) {
      console.warn(`[Stripe] Payment failed for restaurant ${restaurantId}`);
      // Optionally send email alert — plan stays active until subscription.deleted
    }
  }

  return NextResponse.json({ received: true });
}
