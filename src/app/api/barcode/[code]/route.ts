import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { DomainError } from "@/lib/errors";
import { getVariantByBarcode } from "@/services/barcode-service";

// GET /api/barcode/789000002 → variante (produto, cor/tamanho/tom/volume, preço, estoque, imagem)
// Usado por integrações/leitores externos; as telas usam a Server Action equivalente.
export async function GET(_request: Request, { params }: RouteContext<"/api/barcode/[code]">) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!can(user.role, "scanner")) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { code } = await params;
  try {
    const result = await getVariantByBarcode(user.storeId, decodeURIComponent(code));
    if (result.status === "not_found") {
      return NextResponse.json({ found: false, barcode: result.barcode }, { status: 404 });
    }
    return NextResponse.json({ found: true, active: result.active, variant: result.variant });
  } catch (error) {
    if (error instanceof DomainError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
