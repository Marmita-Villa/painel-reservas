import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuPageClient from "./MenuPageClient";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, address: true },
  });
  if (!restaurant) return {};
  return {
    title: `Cardápio — ${restaurant.name}`,
    description: `Veja o cardápio completo do ${restaurant.name}. ${restaurant.address ?? ""}`,
    openGraph: {
      title: `Cardápio — ${restaurant.name}`,
      description: `Cardápio digital do ${restaurant.name}`,
    },
  };
}

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true, name: true, slug: true,
      address: true, phone: true, logoUrl: true,
      plan: true, primaryColor: true,
    },
  });

  if (!restaurant) notFound();

  // Menu só disponível para planos PRO+
  const hasPlan = restaurant.plan === "PRO" || restaurant.plan === "PREMIUM";

  const categories = hasPlan
    ? await prisma.menuCategory.findMany({
        where: { restaurantId: restaurant.id, isActive: true },
        include: {
          items: { where: { isActive: true }, orderBy: { position: "asc" } },
        },
        orderBy: { position: "asc" },
      })
    : [];

  return (
    <MenuPageClient
      restaurant={restaurant}
      categories={categories}
      hasPlan={hasPlan}
    />
  );
}
