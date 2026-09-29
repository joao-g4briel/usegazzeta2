// Postgres local para desenvolvimento (sem Docker).
// Em produção o banco é o Neon, configurado pela DATABASE_URL da Vercel.
//
//   npm run db:start   -> sobe o Postgres em localhost:5433 e mantém rodando
//
import { existsSync } from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.DEV_DB_PORT ?? 5433);
const DATABASE = process.env.DEV_DB_NAME ?? "usegazzeta";
const dataDir = path.resolve(process.cwd(), ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  onLog: () => {},
  onError: (message) => console.error("[postgres]", message),
});

async function main() {
  const firstRun = !existsSync(path.join(dataDir, "PG_VERSION"));
  if (firstRun) {
    console.log("Inicializando o cluster Postgres em .pgdata ...");
    await pg.initialise();
  }

  await pg.start();

  try {
    await pg.createDatabase(DATABASE);
    console.log(`Banco "${DATABASE}" criado.`);
  } catch {
    // Banco já existe.
  }

  console.log(
    `Postgres pronto em postgresql://postgres:postgres@localhost:${PORT}/${DATABASE}`,
  );
  console.log("Ctrl+C para parar.");
}

async function shutdown() {
  console.log("\nParando Postgres...");
  await pg.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(async (error) => {
  console.error(error);
  await pg.stop().catch(() => {});
  process.exit(1);
});
