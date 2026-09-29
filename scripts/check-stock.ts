/**
 * Auditoria de estoque: confere se o estoque de cada variante é exatamente
 * a soma das suas movimentações e se a cadeia antes/depois não tem buracos.
 *
 *   npm run db:check
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const { prisma } = await import("../src/lib/prisma");

const totals = await prisma.$queryRaw<{ id: string; sku: string; stock: number; sum: number }[]>`
  SELECT v.id, v.sku, v.stock, COALESCE(SUM(m.quantity), 0)::int AS sum
  FROM product_variants v
  LEFT JOIN inventory_movements m ON m.variant_id = v.id
  GROUP BY v.id, v.sku, v.stock`;
const mismatched = totals.filter((r) => r.stock !== r.sum);

const broken = await prisma.$queryRaw<{ variant_id: string; n: number }[]>`
  SELECT variant_id, COUNT(*)::int AS n FROM (
    SELECT variant_id, stock_before,
           LAG(stock_after) OVER (PARTITION BY variant_id ORDER BY created_at, id) AS prev
    FROM inventory_movements
  ) t
  WHERE prev IS NOT NULL AND prev <> stock_before
  GROUP BY variant_id`;

const negative = totals.filter((r) => r.stock < 0);

console.log(`Variantes auditadas: ${totals.length}`);
console.log(`Estoque ≠ soma das movimentações: ${mismatched.length}`);
for (const m of mismatched.slice(0, 20)) console.log(`  ${m.sku}: estoque ${m.stock}, movimentações ${m.sum}`);
console.log(`Variantes com cadeia antes/depois inconsistente: ${broken.length}`);
console.log(`Variantes com estoque negativo: ${negative.length}`);

await prisma.$disconnect();
process.exitCode = mismatched.length || negative.length ? 1 : 0;
