import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { DomainError } from "@/lib/errors";
import { saveProductImage } from "@/services/upload-service";

// Upload de fotos de produto. O banco guarda só a URL devolvida aqui.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Entre novamente para enviar fotos." }, { status: 401 });
  if (!can(user.role, "products") && !can(user.role, "scanner")) {
    return NextResponse.json({ error: "Seu perfil não pode enviar fotos." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhuma imagem recebida." }, { status: 400 });
  }

  try {
    const saved = await saveProductImage(file);
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("[upload]", error);
    return NextResponse.json({ error: "Não foi possível enviar a imagem." }, { status: 500 });
  }
}
