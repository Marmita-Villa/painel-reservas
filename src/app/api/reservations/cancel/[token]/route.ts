import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCancellationConfirmation } from '@/lib/notifications';

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f4f5}.card{background:#fff;border-radius:16px;padding:40px;max-width:400px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}h1{color:#18181b;font-size:1.5rem;margin-bottom:12px}p{color:#71717a;line-height:1.6}</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { cancelToken: token },
    include: { restaurant: true, customer: true },
  });

  if (!reservation) {
    return new Response(
      htmlPage('Token inválido', '❌ Link inválido ou expirado.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(reservation.status)) {
    return new Response(
      htmlPage('Reserva já encerrada', '⚠️ Esta reserva já foi cancelada ou encerrada.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Cancel the reservation
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: 'CANCELLED' },
  });

  // Send cancellation confirmation via WhatsApp
  if (reservation.customer?.phone) {
    sendCancellationConfirmation({
      phone: reservation.customer.phone,
      customerName: reservation.customer.name,
      restaurantName: reservation.restaurant.name,
      date: reservation.date,
    }).catch((err) => console.error('[WhatsApp] Cancellation send failed:', err));
  }

  const timeStr = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(reservation.date);

  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(reservation.date);

  const firstName = reservation.customer?.name?.split(' ')[0] ?? 'cliente';

  return new Response(
    htmlPage(
      'Reserva Cancelada',
      `${firstName}, sua reserva no <strong>${reservation.restaurant.name}</strong> de <strong>${dateStr} às ${timeStr}</strong> foi cancelada com sucesso. Esperamos vê-lo em outra ocasião! 😊`
    ),
    { headers: { 'Content-Type': 'text/html' } }
  );
}
