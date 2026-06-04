import { sendWhatsApp } from './whatsapp';
import { prisma } from './prisma';

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://painel-reservas.onrender.com';

function formatDatePtBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function formatTimePtBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

async function sendAndLog(params: {
  phone: string;
  message: string;
  restaurantId: string;
  customerId?: string;
  reservationId?: string;
  type: string;
}): Promise<boolean> {
  const { phone, message, restaurantId, customerId, reservationId, type } = params;
  const success = await sendWhatsApp(phone, message);
  try {
    await prisma.notificationLog.create({
      data: {
        restaurantId,
        customerId: customerId ?? null,
        reservationId: reservationId ?? null,
        type,
        phone,
        message,
        success,
      },
    });
  } catch (err) {
    console.error('[NotificationLog] Failed to log:', err);
  }
  return success;
}

export async function sendReservationConfirmation(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: Date;
  partySize: number;
  confirmToken: string;
  cancelToken: string;
  restaurantId?: string;
  customerId?: string;
  reservationId?: string;
}): Promise<boolean> {
  const { phone, customerName, restaurantName, date, partySize, confirmToken, cancelToken, restaurantId, customerId, reservationId } = params;
  const firstName = customerName.split(' ')[0];
  const dateStr = formatDatePtBR(date);
  const timeStr = formatTimePtBR(date);
  const confirmUrl = `${BASE_URL}/api/reservations/confirm/${confirmToken}`;
  const cancelUrl = `${BASE_URL}/api/reservations/cancel/${cancelToken}`;

  const message = `Olá, ${firstName}! 🍽️\n\nSua reserva no *${restaurantName}* foi confirmada!\n\n📅 ${dateStr}\n⏰ ${timeStr}\n👥 ${partySize} pessoa${partySize > 1 ? 's' : ''}\n\n✅ Confirmar presença: ${confirmUrl}\n❌ Cancelar: ${cancelUrl}\n\nNos vemos em breve!`;

  if (restaurantId) {
    return sendAndLog({ phone, message, restaurantId, customerId, reservationId, type: 'CONFIRMATION' });
  }
  return sendWhatsApp(phone, message);
}

export async function sendReminder24h(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: Date;
  partySize: number;
  confirmToken: string;
  cancelToken: string;
  restaurantId?: string;
  customerId?: string;
  reservationId?: string;
}): Promise<boolean> {
  const { phone, customerName, restaurantName, date, partySize, confirmToken, cancelToken, restaurantId, customerId, reservationId } = params;
  const firstName = customerName.split(' ')[0];
  const timeStr = formatTimePtBR(date);
  const confirmUrl = `${BASE_URL}/api/reservations/confirm/${confirmToken}`;
  const cancelUrl = `${BASE_URL}/api/reservations/cancel/${cancelToken}`;

  const message = `Olá, ${firstName}! 👋\n\nLembrete: você tem uma reserva *amanhã* no *${restaurantName}*!\n\n⏰ ${timeStr}\n👥 ${partySize} pessoa${partySize > 1 ? 's' : ''}\n\n✅ Confirmar: ${confirmUrl}\n❌ Cancelar: ${cancelUrl}`;

  if (restaurantId) {
    return sendAndLog({ phone, message, restaurantId, customerId, reservationId, type: 'REMINDER_24H' });
  }
  return sendWhatsApp(phone, message);
}

export async function sendReminder2h(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: Date;
  partySize: number;
  cancelToken: string;
  restaurantId?: string;
  customerId?: string;
  reservationId?: string;
}): Promise<boolean> {
  const { phone, customerName, restaurantName, date, partySize, cancelToken, restaurantId, customerId, reservationId } = params;
  const firstName = customerName.split(' ')[0];
  const timeStr = formatTimePtBR(date);
  const cancelUrl = `${BASE_URL}/api/reservations/cancel/${cancelToken}`;

  const message = `Olá, ${firstName}! ⏳\n\nSua reserva no *${restaurantName}* é em 2 horas!\n\n⏰ ${timeStr} — hoje!\n👥 ${partySize} pessoa${partySize > 1 ? 's' : ''}\n\nEsperamos por você! 🍽️\n\nPrecisa cancelar? ${cancelUrl}`;

  if (restaurantId) {
    return sendAndLog({ phone, message, restaurantId, customerId, reservationId, type: 'REMINDER_2H' });
  }
  return sendWhatsApp(phone, message);
}

export async function sendCancellationConfirmation(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: Date;
  restaurantId?: string;
  customerId?: string;
  reservationId?: string;
}): Promise<boolean> {
  const { phone, customerName, restaurantName, date, restaurantId, customerId, reservationId } = params;
  const firstName = customerName.split(' ')[0];
  const dateStr = formatDatePtBR(date);
  const timeStr = formatTimePtBR(date);

  const message = `Olá, ${firstName}.\n\nSua reserva no *${restaurantName}* de ${dateStr} às ${timeStr} foi *cancelada* com sucesso.\n\nEsperamos vê-lo em breve! 😊`;

  if (restaurantId) {
    return sendAndLog({ phone, message, restaurantId, customerId, reservationId, type: 'CANCELLATION' });
  }
  return sendWhatsApp(phone, message);
}

export async function sendPostVisitFeedback(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  restaurantId?: string;
  customerId?: string;
  reservationId?: string;
}): Promise<boolean> {
  const { phone, customerName, restaurantName, restaurantId, customerId, reservationId } = params;
  const firstName = customerName.split(' ')[0];
  const message = `Olá, ${firstName}! 😊\n\nEsperamos que tenha tido uma ótima experiência no *${restaurantName}*!\n\nSua opinião é muito importante para nós. Como foi sua visita?\n\nObrigado por nos escolher! Até a próxima! 🍽️`;

  if (restaurantId) {
    return sendAndLog({ phone, message, restaurantId, customerId, reservationId, type: 'POST_VISIT' });
  }
  return sendWhatsApp(phone, message);
}
