import { sendWhatsApp } from './whatsapp';

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

export async function sendReservationConfirmation(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: Date;
  partySize: number;
  confirmToken: string;
  cancelToken: string;
}): Promise<boolean> {
  const { phone, customerName, restaurantName, date, partySize, confirmToken, cancelToken } = params;
  const firstName = customerName.split(' ')[0];
  const dateStr = formatDatePtBR(date);
  const timeStr = formatTimePtBR(date);
  const confirmUrl = `${BASE_URL}/api/reservations/confirm/${confirmToken}`;
  const cancelUrl = `${BASE_URL}/api/reservations/cancel/${cancelToken}`;

  const message = `Olá, ${firstName}! 🍽️\n\nSua reserva no *${restaurantName}* foi confirmada!\n\n📅 ${dateStr}\n⏰ ${timeStr}\n👥 ${partySize} pessoa${partySize > 1 ? 's' : ''}\n\n✅ Confirmar presença: ${confirmUrl}\n❌ Cancelar: ${cancelUrl}\n\nNos vemos em breve!`;

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
}): Promise<boolean> {
  const { phone, customerName, restaurantName, date, partySize, confirmToken, cancelToken } = params;
  const firstName = customerName.split(' ')[0];
  const timeStr = formatTimePtBR(date);
  const confirmUrl = `${BASE_URL}/api/reservations/confirm/${confirmToken}`;
  const cancelUrl = `${BASE_URL}/api/reservations/cancel/${cancelToken}`;

  const message = `Olá, ${firstName}! 👋\n\nLembrete: você tem uma reserva *amanhã* no *${restaurantName}*!\n\n⏰ ${timeStr}\n👥 ${partySize} pessoa${partySize > 1 ? 's' : ''}\n\n✅ Confirmar: ${confirmUrl}\n❌ Cancelar: ${cancelUrl}`;

  return sendWhatsApp(phone, message);
}

export async function sendReminder2h(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: Date;
  partySize: number;
  cancelToken: string;
}): Promise<boolean> {
  const { phone, customerName, restaurantName, date, partySize, cancelToken } = params;
  const firstName = customerName.split(' ')[0];
  const timeStr = formatTimePtBR(date);
  const cancelUrl = `${BASE_URL}/api/reservations/cancel/${cancelToken}`;

  const message = `Olá, ${firstName}! ⏳\n\nSua reserva no *${restaurantName}* é em 2 horas!\n\n⏰ ${timeStr} — hoje!\n👥 ${partySize} pessoa${partySize > 1 ? 's' : ''}\n\nEsperamos por você! 🍽️\n\nPrecisa cancelar? ${cancelUrl}`;

  return sendWhatsApp(phone, message);
}

export async function sendCancellationConfirmation(params: {
  phone: string;
  customerName: string;
  restaurantName: string;
  date: Date;
}): Promise<boolean> {
  const { phone, customerName, restaurantName, date } = params;
  const firstName = customerName.split(' ')[0];
  const dateStr = formatDatePtBR(date);
  const timeStr = formatTimePtBR(date);

  const message = `Olá, ${firstName}.\n\nSua reserva no *${restaurantName}* de ${dateStr} às ${timeStr} foi *cancelada* com sucesso.\n\nEsperamos vê-lo em breve! 😊`;

  return sendWhatsApp(phone, message);
}
