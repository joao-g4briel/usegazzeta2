import { brandIcon } from "@/lib/brand-icon";

// Ícones do manifesto PWA: /icons/192, /icons/512, /icons/maskable-512
const SIZES: Record<string, { size: number; maskable?: boolean }> = {
  "192": { size: 192 },
  "512": { size: 512 },
  "maskable-512": { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((name) => ({ name }));
}

export async function GET(_request: Request, { params }: RouteContext<"/icons/[name]">) {
  const { name } = await params;
  const config = SIZES[name];
  if (!config) return new Response("Not found", { status: 404 });
  return brandIcon(config.size, { maskable: config.maskable });
}
