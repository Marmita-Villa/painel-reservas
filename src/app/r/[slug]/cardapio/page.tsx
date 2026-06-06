import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CardapioPublicClient from "./CardapioPublicClient";

export default async function CardapioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, address: true, phone: true, logoUrl: true },
  });

  if (!restaurant) notFound();

  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId: restaurant.id, isActive: true },
    include: {
      items: {
        where: { isActive: true },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { position: "asc" },
  });

  return <CardapioPublicClient restaurant={restaurant} categories={categories} />;
}
