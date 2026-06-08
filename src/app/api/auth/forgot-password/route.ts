import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  // Always return success to avoid user enumeration
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return NextResponse.json({ ok: true });

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Create token valid for 1 hour
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const resetUrl = `${origin}/redefinir-senha?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Redefinir senha — Réservé",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7">
    <div style="background:#18181b;padding:28px 32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700">Réservé</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#18181b;font-size:16px;margin:0 0 8px">Olá, <strong>${user.name}</strong>!</p>
      <p style="color:#71717a;font-size:14px;margin:0 0 24px">
        Recebemos uma solicitação para redefinir a senha da sua conta.<br>
        Clique no botão abaixo para criar uma nova senha:
      </p>
      <a href="${resetUrl}"
        style="display:block;background:#f07316;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:600;font-size:14px;margin-bottom:16px">
        Redefinir minha senha
      </a>
      <p style="color:#a1a1aa;font-size:12px;text-align:center;margin:0">
        Este link expira em 1 hora.<br>
        Se não foi você, ignore este email.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f4f4f5;text-align:center">
      <p style="color:#a1a1aa;font-size:12px;margin:0">Réservé · Sistema de Reservas</p>
    </div>
  </div>
</body>
</html>`,
    text: `Olá ${user.name}! Clique no link para redefinir sua senha: ${resetUrl}\n\nEste link expira em 1 hora.`,
  });

  return NextResponse.json({ ok: true });
}
