import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f4f4f5}.card{background:#fff;border-radius:16px;padding:40px;max-width:400px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}h1{color:#18181b;font-size:1.5rem;margin-bottom:12px}p{color:#71717a;line-height:1.6}</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { confirmToken: token },
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
      htmlPage('Reserva encerrada', '⚠️ Esta reserva não está mais ativa.'),
      { headers: { 'Content-Type': 'text/html' } }
    );
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
      'Presença Confirmada! ✅',
      `Obrigado, ${firstName}! Sua presença no <strong>${reservation.restaurant.name}</strong> está confirmada para <strong>${dateStr} às ${timeStr}</strong>. Até lá! 🍽️`
    ),
    { headers: { 'Content-Type': 'text/html' } }
  );
}
