import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function ownershipCheck(session: any, id: string) {
  const role = (session.user as any).role;
  const restaurantId = (session.user as any).restaurantId as string | undefined;
  if (role === "MASTER_SUPER") return true;
  return restaurantId === id;
}

const DEFAULTS = {
  autoConfirm: true,
  reminderHoursBefore: 24,
  whatsappEnabled: false,
  noShowFeeEnabled: false,
  noShowFeeAmount: null,
  minNoticeMinutes: 60,
  averageTicket: 0,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ownershipCheck(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.restaurantSettings.findUnique({
    where: { restaurantId: id },
  });

  if (!settings) {
    return NextResponse.json(DEFAULTS);
  }

  return NextResponse.json({
    autoConfirm: settings.autoConfirm,
    reminderHoursBefore: settings.reminderHoursBefore,
    whatsappEnabled: settings.whatsappEnabled,
    noShowFeeEnabled: settings.noShowFeeEnabled,
    noShowFeeAmount: settings.noShowFeeAmount,
    minNoticeMinutes: settings.minNoticeMinutes,
    averageTicket: settings.averageTicket,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ownershipCheck(session, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const data: Record<string, any> = {};
  if (body.autoConfirm !== undefined) data.autoConfirm = Boolean(body.autoConfirm);
  if (body.reminderHoursBefore !== undefined) data.reminderHoursBefore = Number(body.reminderHoursBefore);
  if (body.whatsappEnabled !== undefined) data.whatsappEnabled = Boolean(body.whatsappEnabled);
  if (body.noShowFeeEnabled !== undefined) data.noShowFeeEnabled = Boolean(body.noShowFeeEnabled);
  if (body.noShowFeeAmount !== undefined) data.noShowFeeAmount = body.noShowFeeAmount !== "" && body.noShowFeeAmount !== null ? Number(body.noShowFeeAmount) : null;
  if (body.minNoticeMinutes !== undefined) data.minNoticeMinutes = Number(body.minNoticeMinutes);
  if (body.averageTicket !== undefined) data.averageTicket = body.averageTicket !== "" && body.averageTicket !== null ? Number(body.averageTicket) : 0;

  const settings = await prisma.restaurantSettings.upsert({
    where: { restaurantId: id },
    create: { restaurantId: id, ...data },
    update: data,
  });

  return NextResponse.json(settings);
}
