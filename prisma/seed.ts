/**
 * Dados de demonstração da Use Gazzeta (fictícios).
 *
 * O histórico é gerado pelos próprios serviços do sistema (entrada de estoque,
 * vendas PDV, pedidos online, cancelamentos), então todo número de estoque é
 * explicado por movimentações, exatamente como no uso real.
 */
import "dotenv/config";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: ".env.local", quiet: true });

const { prisma } = await import("../src/lib/prisma");
const { changeStock } = await import("../src/services/inventory-service");
const { finalizeSale } = await import("../src/services/sale-service");
const { placeOrder, updateOrderStatus } = await import("../src/services/order-service");
const { getStoreById } = await import("../src/services/store-service");
const { buildSku, slugify } = await import("../src/lib/variant");
const { addDays, startOfStoreDay } = await import("../src/lib/dates");

type Kind = "APPAREL" | "BEAUTY" | "FRAGRANCE" | "ACCESSORY" | "OTHER";
type Badge = "MAIS_VENDIDO" | "NOVIDADE" | "OFERTA" | "TENDENCIA" | "FAVORITO" | "ULTIMAS_PECAS";

type SeedVariant = {
  color?: string;
  size?: string;
  tone?: string;
  volume?: string;
  price?: number;
  promo?: number;
  cost?: number;
  target: number; // estoque final desejado depois do histórico
  min?: number;
};

type SeedProduct = {
  name: string;
  category: string;
  brand?: string;
  description: string;
  price: number;
  cost: number;
  promo?: number;
  badge?: Badge;
  featured?: boolean;
  newProduct?: boolean;
  onSale?: boolean;
  weight: number; // popularidade no histórico
  variants: SeedVariant[];
};

const CATEGORIES: { name: string; slug: string; kind: Kind; tagline: string; description: string }[] = [
  {
    name: "Roupas",
    slug: "roupas",
    kind: "APPAREL",
    tagline: "Looks para todas as ocasiões",
    description: "Vestidos, conjuntos, croppeds e tricôs escolhidos a dedo.",
  },
  {
    name: "Maquiagens",
    slug: "maquiagens",
    kind: "BEAUTY",
    tagline: "Realce o que te faz única",
    description: "Batons, glosses, paletas e kits para todos os dias.",
  },
  {
    name: "Perfumes",
    slug: "perfumes",
    kind: "FRAGRANCE",
    tagline: "Fragrâncias que deixam a sua marca",
    description: "Perfumes e body splashes para cada momento.",
  },
  {
    name: "Acessórios",
    slug: "acessorios",
    kind: "ACCESSORY",
    tagline: "Detalhes que completam o look",
    description: "Brincos, bolsas e pequenos detalhes.",
  },
  {
    name: "Outros",
    slug: "outros",
    kind: "OTHER",
    tagline: "Presentes e achados da loja",
    description: "Itens que não se encaixam nas outras categorias.",
  },
];

const PRODUCTS: SeedProduct[] = [
  {
    name: "Vestido Frente Única",
    category: "roupas",
    description:
      "Vestido leve de frente única com gola alta franzida e barra em camadas. Tecido fluido que acompanha o movimento — perfeito para o dia e para a noite.",
    price: 89.9,
    cost: 38,
    badge: "MAIS_VENDIDO",
    featured: true,
    weight: 9,
    variants: [
      { color: "Amarelo", size: "P", target: 2, min: 2 },
      { color: "Amarelo", size: "M", target: 4, min: 2 },
      { color: "Rosa", size: "P", target: 5, min: 2 },
      { color: "Amarelo", size: "G", target: 1, min: 2 },
      { color: "Rosa", size: "M", target: 0, min: 2 },
      { color: "Rosa", size: "G", target: 3, min: 2 },
    ],
  },
  {
    name: "Cropped Tricô",
    category: "roupas",
    description:
      "Cropped de tricô artesanal com alças finas e ponto vazado. Combina com jeans, saias e alfaiataria.",
    price: 59.9,
    cost: 22,
    badge: "TENDENCIA",
    featured: true,
    weight: 7,
    variants: [
      { color: "Verde", size: "Único", target: 6, min: 2 },
      { color: "Rosa", size: "Único", target: 2, min: 2 },
      { color: "Vermelho", size: "M", target: 1, min: 2 },
    ],
  },
  {
    name: "Conjunto Alfaiataria",
    category: "roupas",
    description:
      "Conjunto de alfaiataria com top estruturado e saia de cintura alta. Caimento impecável e toque macio.",
    price: 109.9,
    cost: 48,
    featured: true,
    newProduct: true,
    weight: 5,
    variants: [
      { color: "Rosa", size: "P", target: 3, min: 1 },
      { color: "Rosa", size: "M", target: 1, min: 1 },
      { color: "Rosa", size: "G", target: 4, min: 1 },
    ],
  },
  {
    name: "Conjunto Saia e Top",
    category: "roupas",
    description: "Top tomara que caia e short-saia com recorte envelope. Básico que vira produção.",
    price: 99.9,
    cost: 42,
    featured: true,
    weight: 5,
    variants: [
      { color: "Preto", size: "P", target: 1, min: 1 },
      { color: "Preto", size: "M", target: 2, min: 1 },
      { color: "Preto", size: "G", target: 0, min: 1 },
    ],
  },
  {
    name: "Blusa Tricô Listrada",
    category: "roupas",
    description: "Blusa de tricô com listras finas e gola careca. Leve, fresca e fácil de combinar.",
    price: 69.9,
    cost: 27,
    weight: 4,
    variants: [
      { color: "Rosa", size: "Único", target: 7, min: 2 },
      { color: "Off-white", size: "Único", target: 4, min: 2 },
    ],
  },
  {
    name: "Vestido Midi Vinho",
    category: "roupas",
    description: "Vestido midi acetinado com alças reguláveis e fenda lateral.",
    price: 149.9,
    promo: 129.9,
    cost: 62,
    onSale: true,
    weight: 3,
    variants: [
      { color: "Vinho", size: "P", target: 2, min: 1 },
      { color: "Vinho", size: "M", target: 3, min: 1 },
      { color: "Vinho", size: "G", target: 2, min: 1 },
    ],
  },
  {
    name: "Conjunto Bustiê e Short",
    category: "roupas",
    description: "Bustiê com bojo e short de cintura alta no mesmo tom. Conjunto que é a cara do verão.",
    price: 99.9,
    cost: 40,
    newProduct: true,
    weight: 4,
    variants: [
      { color: "Amarelo", size: "P", target: 4, min: 1 },
      { color: "Amarelo", size: "M", target: 3, min: 1 },
      { color: "Amarelo", size: "G", target: 2, min: 1 },
    ],
  },
  {
    name: "Kit Make Glow",
    category: "maquiagens",
    brand: "Use Gazzeta",
    description:
      "Paleta de sombras em tons pêssego e rosé com batom cremoso. Tudo o que você precisa para um glow natural.",
    price: 79.9,
    cost: 34,
    badge: "NOVIDADE",
    featured: true,
    weight: 6,
    variants: [{ target: 15, min: 4 }],
  },
  {
    name: "Gloss Rosé",
    category: "maquiagens",
    description: "Gloss de efeito espelhado com brilho que não gruda. Três tons para todos os momentos.",
    price: 39.9,
    cost: 14,
    weight: 6,
    variants: [
      { tone: "Nude 01", target: 12, min: 3 },
      { tone: "Rosé 02", target: 8, min: 3 },
      { tone: "Vinho 03", target: 3, min: 3 },
    ],
  },
  {
    name: "Batom Nude Elegance",
    category: "maquiagens",
    description: "Batom cremoso de alta cobertura com acabamento acetinado.",
    price: 36.9,
    cost: 12,
    weight: 5,
    variants: [
      { tone: "Nude 01", target: 20, min: 4 },
      { tone: "Terracota 02", target: 9, min: 4 },
    ],
  },
  {
    name: "Batom Matte Bala",
    category: "maquiagens",
    description: "Batom matte em bala, cor intensa e longa duração.",
    price: 10,
    cost: 3.5,
    weight: 6,
    variants: [
      { tone: "Vermelho 01", target: 18, min: 5 },
      { tone: "Rosa 02", target: 14, min: 5 },
    ],
  },
  {
    name: "Paleta Make Glow",
    category: "maquiagens",
    description: "Paleta com nove sombras entre mates e cintilantes.",
    price: 89.9,
    cost: 38,
    weight: 3,
    variants: [{ target: 2, min: 3 }],
  },
  {
    name: "Perfume Use Gazzeta",
    category: "perfumes",
    brand: "Use Gazzeta",
    description:
      "Nossa assinatura: floral frutado com notas de pêssego, peônia e baunilha. Marcante sem ser pesado.",
    price: 159.9,
    cost: 62,
    badge: "FAVORITO",
    featured: true,
    weight: 6,
    variants: [
      { volume: "50ml", price: 109.9, cost: 45, target: 6, min: 2 },
      { volume: "100ml", price: 159.9, cost: 62, target: 4, min: 2 },
    ],
  },
  {
    name: "Body Splash Vanilla",
    category: "perfumes",
    description: "Body splash de baunilha cremosa para usar o dia todo.",
    price: 89.9,
    cost: 31,
    weight: 4,
    variants: [{ volume: "200ml", target: 25, min: 5 }],
  },
  {
    name: "Perfume Floral Rosé",
    category: "perfumes",
    description: "Floral delicado com rosas, lichia e almíscar branco.",
    price: 149.9,
    cost: 58,
    newProduct: true,
    weight: 3,
    variants: [
      { volume: "30ml", price: 69.9, cost: 27, target: 5, min: 2 },
      { volume: "50ml", price: 99.9, cost: 39, target: 4, min: 2 },
      { volume: "100ml", price: 149.9, cost: 58, target: 2, min: 2 },
    ],
  },
  {
    name: "Brinco Argola",
    category: "acessorios",
    description: "Argola média leve, com banho resistente.",
    price: 29.9,
    cost: 9,
    weight: 3,
    variants: [
      { color: "Dourado", target: 10, min: 3 },
      { color: "Prata", target: 6, min: 3 },
    ],
  },
  {
    name: "Bolsa Tiracolo Matelassê",
    category: "acessorios",
    description: "Bolsa tiracolo com costura matelassê e alça de corrente.",
    price: 129.9,
    cost: 55,
    weight: 2,
    variants: [
      { color: "Preto", target: 3, min: 1 },
      { color: "Bege", target: 2, min: 1 },
    ],
  },
];

const CUSTOMERS = [
  ["Ana Clara Silva", "ana.clara"],
  ["Juliana Pereira", "juliana.pereira"],
  ["Beatriz Lima", "beatriz.lima"],
  ["Camila Rocha", "camila.rocha"],
  ["Larissa Mendes", "larissa.mendes"],
  ["Fernanda Alves", "fernanda.alves"],
  ["Mariana Costa", "mariana.costa"],
  ["Patrícia Souza", "patricia.souza"],
  ["Renata Gomes", "renata.gomes"],
  ["Aline Ribeiro", "aline.ribeiro"],
  ["Bruna Carvalho", "bruna.carvalho"],
  ["Gabriela Martins", "gabriela.martins"],
  ["Letícia Barros", "leticia.barros"],
  ["Vanessa Duarte", "vanessa.duarte"],
] as const;

const ADDRESSES = [
  { city: "Recife", state: "PE", district: "Boa Viagem", street: "Rua dos Navegantes" },
  { city: "Olinda", state: "PE", district: "Casa Caiada", street: "Av. Getúlio Vargas" },
  { city: "João Pessoa", state: "PB", district: "Manaíra", street: "Rua Silvino Lopes" },
  { city: "Salvador", state: "BA", district: "Pituba", street: "Rua Minas Gerais" },
  { city: "São Paulo", state: "SP", district: "Pinheiros", street: "Rua dos Pinheiros" },
  { city: "Fortaleza", state: "CE", district: "Aldeota", street: "Rua Silva Paulet" },
] as const;

// PRNG determinístico: o seed gera sempre o mesmo histórico.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260929);
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

async function main() {
  const existing = await prisma.store.findUnique({ where: { slug: "use-gazzeta" } });
  if (existing) {
    console.log('A loja "use-gazzeta" já existe. Para recriar do zero: npm run db:reset');
    return;
  }

  console.log("Criando loja, usuária e categorias…");
  const store = await prisma.store.create({
    data: {
      name: "Use Gazzeta",
      slug: "use-gazzeta",
      shippingFlatRate: "19.90",
      freeShippingThreshold: "299.00",
      maxInstallments: 6,
      minInstallmentValue: "25.00",
    },
  });

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@usegazzeta.com.br").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 6) {
    throw new Error("Defina SEED_ADMIN_PASSWORD (mínimo 6 caracteres) no .env.local antes do seed.");
  }
  const admin = await prisma.user.create({
    data: {
      storeId: store.id,
      name: process.env.SEED_ADMIN_NAME ?? "Administradora",
      email: adminEmail,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  const categoryIds = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const created = await prisma.category.create({
      data: {
        storeId: store.id,
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        description: c.description,
        variantKind: c.kind,
        position: i + 1,
      },
    });
    categoryIds.set(c.slug, created.id);
  }

  console.log("Criando produtos e variantes…");
  type Planned = { variantId: string; productWeight: number; target: number; sold: number; kind: Kind };
  const planned: Planned[] = [];
  let barcode = 789000001;
  const now = new Date();
  const createdBase = addDays(now, -90);

  for (const [pi, p] of PRODUCTS.entries()) {
    const kind = CATEGORIES.find((c) => c.slug === p.category)!.kind;
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: categoryIds.get(p.category)!,
        name: p.name,
        slug: slugify(p.name),
        description: p.description,
        brand: p.brand ?? null,
        basePrice: p.price.toFixed(2),
        featured: p.featured ?? false,
        newProduct: p.newProduct ?? false,
        onSale: p.onSale ?? false,
        badge: p.badge ?? null,
        createdAt: p.newProduct ? addDays(now, -12 + pi % 5) : addDays(createdBase, pi),
      },
    });
    for (const [vi, v] of p.variants.entries()) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: buildSku(p.name, v),
          barcode: String(barcode++),
          color: v.color ?? null,
          size: v.size ?? null,
          tone: v.tone ?? null,
          volume: v.volume ?? null,
          costPrice: (v.cost ?? p.cost).toFixed(2),
          salePrice: (v.price ?? p.price).toFixed(2),
          promotionalPrice: p.promo && !v.price ? p.promo.toFixed(2) : null,
          minimumStock: v.min ?? 2,
          position: vi,
          stock: 0,
        },
      });
      planned.push({ variantId: variant.id, productWeight: p.weight, target: v.target, sold: 0, kind });
    }
  }

  console.log("Criando clientes e cupons…");
  const customers = [];
  for (const [i, [name, handle]] of CUSTOMERS.entries()) {
    const phone = `8190000${String(1000 + i * 37).slice(-4)}`;
    customers.push(
      await prisma.customer.create({
        data: {
          storeId: store.id,
          name,
          email: `${handle}@example.com`,
          phone,
          whatsapp: phone,
          createdAt: addDays(now, -80 + i * 3),
        },
      }),
    );
  }

  await prisma.coupon.createMany({
    data: [
      {
        storeId: store.id,
        code: "BEMVINDA10",
        description: "10% na primeira compra",
        type: "PERCENTUAL",
        value: "10",
        minimumAmount: "100.00",
      },
      {
        storeId: store.id,
        code: "GAZZETA20",
        description: "R$ 20 de desconto acima de R$ 150",
        type: "VALOR_FIXO",
        value: "20.00",
        minimumAmount: "150.00",
        maxUses: 100,
      },
      {
        storeId: store.id,
        code: "AMIGA5",
        description: "5% para indicação",
        type: "PERCENTUAL",
        value: "5",
        active: false,
      },
    ],
  });

  // ─── Planejamento do histórico (75 dias) ───
  console.log("Planejando histórico de vendas…");
  type PlannedItem = { variantId: string; quantity: number };
  type Event =
    | { kind: "sale"; at: Date; items: PlannedItem[]; customer: number | null; method: "PIX" | "DINHEIRO" | "CREDITO" | "DEBITO"; discount: boolean }
    | { kind: "order"; at: Date; items: PlannedItem[]; customer: number; status: string; shipping: "ENTREGA" | "RETIRADA"; payment: "PIX" | "CREDITO" }
    | { kind: "cancel"; at: Date; order: Event };

  const totalWeight = planned.reduce((s, v) => s + v.productWeight, 0);
  const pickVariant = () => {
    let r = rand() * totalWeight;
    for (const v of planned) {
      r -= v.productWeight;
      if (r <= 0) return v;
    }
    return planned[planned.length - 1];
  };
  const pickItems = (max: number): PlannedItem[] => {
    const count = between(1, max);
    const items: PlannedItem[] = [];
    for (let i = 0; i < count; i++) {
      const v = pickVariant();
      if (items.some((x) => x.variantId === v.variantId)) continue;
      items.push({ variantId: v.variantId, quantity: v.kind === "BEAUTY" && rand() < 0.3 ? 2 : 1 });
    }
    return items;
  };

  const events: Event[] = [];
  const today = startOfStoreDay(now);
  for (let d = 75; d >= 0; d--) {
    const day = addDays(today, -d);
    const weekday = new Date(day.getTime() - 3 * 3600000).getUTCDay();
    const busy = weekday === 5 || weekday === 6;
    const trend = 1 + (75 - d) / 110;
    const sales = d === 0 ? 5 : Math.round(between(1, busy ? 6 : 4) * trend);
    const orders = d === 0 ? 3 : Math.round(between(0, busy ? 3 : 2) * trend);

    const stamp = (i: number, count: number) => {
      // Horário comercial (9h–19h no fuso da loja); hoje, só até agora.
      const openMs = day.getTime() + 9 * 3600000;
      const closeMs =
        d === 0 ? Math.min(now.getTime() - 5 * 60000, day.getTime() + 19 * 3600000) : day.getTime() + 19 * 3600000;
      const start = closeMs <= openMs ? day.getTime() + 60000 : openMs;
      const span = Math.max(closeMs - start, 60000);
      return new Date(start + Math.floor(((i + rand()) / count) * span));
    };

    for (let i = 0; i < sales; i++) {
      const r = rand();
      events.push({
        kind: "sale",
        at: stamp(i, sales),
        items: pickItems(3),
        customer: rand() < 0.45 ? between(0, customers.length - 1) : null,
        method: r < 0.45 ? "PIX" : r < 0.7 ? "CREDITO" : r < 0.85 ? "DEBITO" : "DINHEIRO",
        discount: rand() < 0.08,
      });
    }
    for (let i = 0; i < orders; i++) {
      const roll = rand();
      let status: string;
      if (d >= 12) status = roll < 0.1 ? "CANCELADO" : "ENTREGUE";
      else if (d >= 5) status = roll < 0.08 ? "CANCELADO" : roll < 0.55 ? "ENTREGUE" : "ENVIADO";
      else if (d >= 2) status = roll < 0.4 ? "ENVIADO" : roll < 0.8 ? "EM_SEPARACAO" : "PAGO";
      else status = roll < 0.5 ? "AGUARDANDO_PAGAMENTO" : "PAGO";
      events.push({
        kind: "order",
        at: stamp(i, Math.max(orders, 1)),
        items: pickItems(3),
        customer: between(0, customers.length - 1),
        status,
        shipping: rand() < 0.2 ? "RETIRADA" : "ENTREGA",
        payment: rand() < 0.65 ? "PIX" : "CREDITO",
      });
    }
  }
  // Pedidos cancelados só levam peças com estoque folgado (a reserva nunca zera a variante)
  // e são cancelados ~36h depois, na ordem do tempo.
  for (const e of [...events]) {
    if (e.kind === "order" && e.status === "CANCELADO") {
      e.items = e.items.filter((i) => planned.find((p) => p.variantId === i.variantId)!.target >= 4);
      if (!e.items.length) {
        e.status = "ENTREGUE";
        e.items = [{ variantId: planned.find((p) => p.target >= 10)!.variantId, quantity: 1 }];
        continue;
      }
      const at = new Date(Math.min(e.at.getTime() + 36 * 3600000, now.getTime() - 60000));
      events.push({ kind: "cancel", at, order: e });
    }
  }
  events.sort((a, b) => a.at.getTime() - b.at.getTime());

  // Quanto cada variante vende (pedidos cancelados devolvem a peça).
  for (const e of events) {
    if (e.kind === "cancel" || (e.kind === "order" && e.status === "CANCELADO")) continue;
    for (const item of e.items) planned.find((p) => p.variantId === item.variantId)!.sold += item.quantity;
  }

  console.log("Registrando entradas de estoque…");
  const entryAt = addDays(today, -80);
  for (const p of planned) {
    const quantity = p.target + p.sold;
    if (quantity <= 0) continue;
    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: p.variantId } });
    await prisma.$transaction((tx) =>
      changeStock(tx, {
        storeId: store.id,
        variantId: p.variantId,
        delta: quantity,
        type: "ENTRADA",
        userId: admin.id,
        unitCost: Number(variant.costPrice),
        supplier: "Fornecedor demonstração",
        reason: "Estoque inicial (dados de demonstração)",
        createdAt: entryAt,
      }),
    );
  }

  console.log(`Gerando ${events.length} vendas e pedidos…`);
  const storeInfo = await getStoreById(store.id);
  const orderIds = new Map<Event, string>();
  let n = 0;
  for (const e of events) {
    n++;
    if (e.kind === "cancel") {
      const id = orderIds.get(e.order);
      if (id) await updateOrderStatus(store.id, admin.id, id, "CANCELADO", { at: e.at });
    } else if (e.kind === "sale") {
      await finalizeSale(
        store.id,
        admin.id,
        {
          items: e.items,
          customerId: e.customer === null ? null : customers[e.customer].id,
          discount: e.discount ? { type: "percent", value: 10 } : null,
          discountReason: e.discount ? "Cliente fiel" : null,
          couponCode: null,
          payments: [
            {
              method: e.method,
              amount: null,
              receivedAmount: null,
              installments: e.method === "CREDITO" ? between(1, 3) : null,
            },
          ],
        },
        { createdAt: e.at },
      );
    } else {
      const c = customers[e.customer];
      const addr = pick(ADDRESSES);
      const order = await placeOrder(
        storeInfo,
        {
          items: e.items,
          customer: { name: c.name, email: c.email!, phone: c.phone!, whatsapp: c.whatsapp, cpf: null },
          shippingMethod: e.shipping,
          address:
            e.shipping === "ENTREGA"
              ? {
                  zipCode: "50000000",
                  street: addr.street,
                  number: String(between(10, 1500)),
                  complement: rand() < 0.4 ? `Apto ${between(101, 1502)}` : null,
                  district: addr.district,
                  city: addr.city,
                  state: addr.state,
                }
              : null,
          couponCode: null,
          paymentMethod: e.payment,
          notes: null,
        },
        { createdAt: e.at },
      );
      orderIds.set(e, order.id);
      const flow = ["PAGO", "EM_SEPARACAO", "ENVIADO", "ENTREGUE"];
      if (e.status !== "AGUARDANDO_PAGAMENTO" && e.status !== "CANCELADO") {
        for (const step of flow) {
          await updateOrderStatus(store.id, admin.id, order.id, step as "PAGO");
          if (step === e.status) break;
        }
      }
    }
    if (n % 50 === 0) console.log(`  ${n}/${events.length}`);
  }

  // Datas de atualização coerentes para os pedidos gerados.
  await prisma.$executeRaw`UPDATE orders SET updated_at = created_at + interval '2 days' WHERE updated_at > created_at + interval '2 days' AND created_at < now() - interval '3 days'`;

  const check = await prisma.productVariant.findMany({ select: { id: true, stock: true } });
  const mismatches = planned.filter((p) => check.find((c) => c.id === p.variantId)?.stock !== p.target);
  console.log(
    mismatches.length
      ? `Atenção: ${mismatches.length} variantes com estoque diferente do planejado.`
      : "Estoque final confere com o planejado.",
  );
  console.log(`\nPronto. Entre em /login com ${adminEmail} e a senha definida em SEED_ADMIN_PASSWORD.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
