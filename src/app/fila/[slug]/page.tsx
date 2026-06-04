import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FilaPublicClient from "./FilaPublicClient";

export default async function FilaPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!restaurant) notFound();

  const waitingCount = await prisma.waitlistEntry.count({
    where: { restaurantId: restaurant.id, status: "WAITING" },
  });

  const avgEntry = await prisma.waitlistEntry.aggregate({
    where: { restaurantId: restaurant.id, status: "WAITING" },
    _avg: { estimatedWait: true },
  });

  const estimatedWait = Math.round(avgEntry._avg.estimatedWait ?? waitingCount * 15);

  return (
    <FilaPublicClient
      restaurant={{ id: restaurant.id, name: restaurant.name, slug: restaurant.slug }}
      initialWaitingCount={waitingCount}
      initialEstimatedWait={estimatedWait}
    />
  );
}
