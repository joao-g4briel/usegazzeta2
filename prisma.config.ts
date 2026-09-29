import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js lê .env.local sozinho; a CLI do Prisma precisa carregar explicitamente.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

// `prisma generate` (postinstall/build) não conecta ao banco, então não pode
// exigir DATABASE_URL — ela pode não existir no install da Vercel. Comandos que
// realmente conectam (migrate, seed) falham na conexão se ela estiver ausente.
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
