import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[Email MOCK] To: ${params.to} | Subject: ${params.subject}`);
    return true;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return true;
  } catch (err) {
    console.error('[Email] Send error:', err);
    return false;
  }
}

export function buildConfirmationEmail(params: {
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  confirmUrl: string;
  cancelUrl: string;
}): { subject: string; html: string; text: string } {
  const { customerName, restaurantName, date, time, partySize, confirmUrl, cancelUrl } = params;
  const first = customerName.split(' ')[0];
  const subject = `Reserva confirmada — ${restaurantName}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7">
    <div style="background:#18181b;padding:32px 32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">${restaurantName}</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#18181b;font-size:16px;margin:0 0 8px">Olá, <strong>${first}</strong>!</p>
      <p style="color:#71717a;font-size:14px;margin:0 0 24px">Sua reserva foi confirmada com sucesso.</p>
      <div style="background:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#71717a;font-size:13px;padding:6px 0">📅 Data</td><td style="color:#18181b;font-size:13px;font-weight:600;text-align:right">${date}</td></tr>
          <tr><td style="color:#71717a;font-size:13px;padding:6px 0">⏰ Horário</td><td style="color:#18181b;font-size:13px;font-weight:600;text-align:right">${time}</td></tr>
          <tr><td style="color:#71717a;font-size:13px;padding:6px 0">👥 Pessoas</td><td style="color:#18181b;font-size:13px;font-weight:600;text-align:right">${partySize} pessoa${partySize > 1 ? 's' : ''}</td></tr>
        </table>
      </div>
      <a href="${confirmUrl}" style="display:block;background:#16a34a;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:600;font-size:14px;margin-bottom:12px">✅ Confirmar presença</a>
      <a href="${cancelUrl}" style="display:block;background:#f4f4f5;color:#71717a;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-size:14px">Cancelar reserva</a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f4f4f5;text-align:center">
      <p style="color:#a1a1aa;font-size:12px;margin:0">Réservé · Sistema de Reservas</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Olá ${first}! Sua reserva no ${restaurantName} foi confirmada.\n\nData: ${date}\nHorário: ${time}\nPessoas: ${partySize}\n\nConfirmar: ${confirmUrl}\nCancelar: ${cancelUrl}`;

  return { subject, html, text };
}
