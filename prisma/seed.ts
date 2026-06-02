import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "ristorante-roma" },
    update: {},
    create: {
      name: "Ristorante Roma",
      slug: "ristorante-roma",
      phone: "(11) 99999-9999",
      email: "contato@ristoranteroma.com.br",
      address: "Rua Augusta, 1200 — Consolação, São Paulo",
      timezone: "America/Sao_Paulo",
    },
  });

  console.log(`✅ Restaurant: ${restaurant.name} (${restaurant.id})`);

  await prisma.restaurantSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      maxAdvanceDays: 30,
      minNoticeMinutes: 60,
      defaultSlotDuration: 90,
      autoConfirm: true,
      reminderHoursBefore: 24,
    },
  });

  const room = await prisma.room.upsert({
    where: { id: "room-main" },
    update: {},
    create: {
      id: "room-main",
      restaurantId: restaurant.id,
      name: "Salão Principal",
      isActive: true,
    },
  });

  const tablesData = [
    { id: "t1", name: "Mesa 1", capacity: 2, posX: 1, posY: 1 },
    { id: "t2", name: "Mesa 2", capacity: 4, posX: 2, posY: 1 },
    { id: "t3", name: "Mesa 3", capacity: 2, posX: 3, posY: 1 },
    { id: "t4", name: "Mesa 4", capacity: 6, posX: 1, posY: 2 },
    { id: "t5", name: "Mesa 5", capacity: 4, posX: 2, posY: 2 },
    { id: "t6", name: "Mesa 6", capacity: 4, posX: 3, posY: 2 },
    { id: "t7", name: "Mesa 7", capacity: 8, posX: 1, posY: 3 },
    { id: "t8", name: "Mesa 8", capacity: 2, posX: 2, posY: 3 },
    { id: "t9", name: "Mesa 9", capacity: 4, posX: 3, posY: 3 },
  ];

  for (const t of tablesData) {
    await prisma.table.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, roomId: room.id },
    });
  }
  console.log(`✅ ${tablesData.length} tables`);

  const customersData = [
    { name: "João Silva", phone: "(11) 99999-1234", visitCount: 12 },
    { name: "Maria Oliveira", phone: "(21) 98888-5678", visitCount: 5, noShowCount: 1 },
    { name: "Carlos Santos", phone: "(11) 97777-9012", visitCount: 8 },
    { name: "Ana Costa", phone: "(31) 96666-3456", visitCount: 2, noShowCount: 2 },
    { name: "Pedro Almeida", phone: "(11) 95555-7890", visitCount: 20 },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { restaurantId_phone: { restaurantId: restaurant.id, phone: c.phone } },
      update: {},
      create: {
        restaurantId: restaurant.id,
        name: c.name,
        phone: c.phone,
        visitCount: c.visitCount || 0,
        noShowCount: (c as any).noShowCount || 0,
      },
    });
    createdCustomers.push(customer);
  }
  console.log(`✅ ${customersData.length} customers`);

  const today = new Date();
  const reservationsData = [
    { customerIdx: 0, tableId: "t5", hour: 12, min: 0, party: 4, status: "CONFIRMED", origin: "WIDGET" },
    { customerIdx: 1, tableId: "t2", hour: 12, min: 30, party: 2, status: "ARRIVED", origin: "GOOGLE" },
    { customerIdx: 2, tableId: "t7", hour: 13, min: 0, party: 6, status: "SEATED", origin: "INTERNAL" },
    { customerIdx: 3, tableId: "t3", hour: 13, min: 30, party: 3, status: "CONFIRMED", origin: "WHATSAPP" },
    { customerIdx: 4, tableId: "t1", hour: 14, min: 0, party: 2, status: "NO_SHOW", origin: "WIDGET" },
    { customerIdx: 0, tableId: "t6", hour: 19, min: 0, party: 5, status: "CONFIRMED", origin: "INTERNAL" },
    { customerIdx: 1, tableId: "t9", hour: 19, min: 30, party: 2, status: "CONFIRMED", origin: "GOOGLE" },
    { customerIdx: 2, tableId: "t4", hour: 20, min: 0, party: 8, status: "PENDING", origin: "WIDGET" },
  ];

  for (const r of reservationsData) {
    const date = new Date(today);
    date.setHours(r.hour, r.min, 0, 0);
    await prisma.reservation.create({
      data: {
        restaurantId: restaurant.id,
        customerId: createdCustomers[r.customerIdx].id,
        tableId: r.tableId,
        date,
        partySize: r.party,
        status: r.status as any,
        origin: r.origin as any,
        duration: 90,
      },
    });
  }
  console.log(`✅ ${reservationsData.length} reservations`);

  console.log("\n🎉 Seed complete!");
  console.log(`Restaurant ID: ${restaurant.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
