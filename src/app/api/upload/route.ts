import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const cld = getCloudinary();
  if (!cld) return NextResponse.json({ error: "Cloudinary não configurado" }, { status: 503 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "reserva360";

  if (!file) return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5MB." }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WebP ou SVG." }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cld.uploader.upload(base64, {
      folder,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err: any) {
    console.error("[Cloudinary upload error]", err);
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
