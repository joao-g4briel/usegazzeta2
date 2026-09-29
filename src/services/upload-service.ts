import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { DomainError } from "@/lib/errors";
import { slugify } from "@/lib/variant";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

/**
 * Salva a imagem fora do banco e devolve só a URL.
 * Produção: Vercel Blob. Desenvolvimento sem token: public/uploads.
 */
export async function saveProductImage(file: File): Promise<{ url: string }> {
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new DomainError("Envie imagens JPG, PNG, WEBP ou AVIF.", "INVALID_FILE");
  if (file.size > MAX_BYTES) throw new DomainError("Cada imagem pode ter no máximo 5 MB.", "FILE_TOO_LARGE");

  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "foto";
  const name = `${base}-${randomUUID().slice(0, 8)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`produtos/${name}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return { url: blob.url };
  }

  if (process.env.NODE_ENV === "production") {
    throw new DomainError(
      "Upload de imagens não configurado. Defina BLOB_READ_WRITE_TOKEN nas variáveis da Vercel.",
      "UPLOAD_NOT_CONFIGURED",
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${name}` };
}
