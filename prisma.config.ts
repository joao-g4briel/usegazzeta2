import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js lê .env.local sozinho; a CLI do Prisma precisa carregar explicitamente.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
