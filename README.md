# Use Gazzeta

Sistema completo da **Use Gazzeta** — loja virtual, painel administrativo e PDV com scanner de código de barras — num único projeto Next.js full-stack, com **um só banco e um só estoque**.

```
                    VERCEL
                       │
                    NEXT.JS
          ┌────────────┼────────────┐
        LOJA         PAINEL        PDV / SCANNER
          └────────────┼────────────┘
                 SERVER ACTIONS
                       │
                   SERVICES   (regras de negócio, transações)
                       │
                    PRISMA 7
                       │
             POSTGRESQL (Neon em produção)
```

## A regra central

| Conceito | No sistema |
|---|---|
| **Produto** | o modelo (ex.: *Vestido Frente Única*) |
| **Variante** | o item físico vendável (ex.: *Amarelo / M*) |
| Código de barras | pertence à variante (único no catálogo inteiro) |
| Estoque | pertence à variante — o total do produto é sempre calculado |
| Venda PDV, pedido online, scanner | sempre por `variantId` |

- Nenhuma alteração de estoque acontece sem uma linha em `inventory_movements` (ENTRADA, VENDA_PDV, VENDA_ONLINE, AJUSTE, DEVOLUCAO, CANCELAMENTO, PERDA), com estoque anterior e posterior.
- Vendas e pedidos rodam em `prisma.$transaction`. A baixa usa `UPDATE … WHERE stock >= quantidade`: duas vendas simultâneas da última peça nunca deixam o estoque negativo — a segunda falha com “Estoque insuficiente” e tudo é desfeito.
- Preço, desconto, cupom e estoque são sempre recalculados no servidor.
- `npm run db:check` audita o banco: estoque de cada variante = soma das movimentações.

## Stack

Next.js 16 (App Router, Server Components, Server Actions, `proxy.ts`) · React 19 · TypeScript strict · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide · Prisma 7 + PostgreSQL (`@prisma/adapter-pg`) · Auth.js v5 (credenciais, JWT) · Zod 4 · React Hook Form · Recharts · ZXing + BarcodeDetector nativo · Vercel Blob.

## Rodando localmente

Pré-requisito: Node 20+ (testado com Node 24). Não precisa de Docker.

```bash
npm install
cp .env.example .env.local        # já existe um .env.local de desenvolvimento
npm run db:start                  # Postgres embutido em localhost:5433 (deixe rodando)
npx prisma migrate dev            # cria as tabelas
npm run db:seed                   # dados de demonstração
npm run dev                       # http://localhost:3000
```

Acesse:

- **Loja:** `/`
- **Painel:** `/admin` — login com `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` do `.env.local` (dev: `admin@usegazzeta.com.br` / `gazzeta123`)
- **PDV:** `/pdv` · **Scanner:** `/pdv/scanner` (atalho `/scanner`)

Recriar o banco do zero: `npm run db:reset` (apaga tudo e roda o seed de novo).

### Câmera no celular

Navegadores só liberam a câmera em **HTTPS** (ou `localhost`). Para testar o scanner no celular pela rede local:

```bash
npm run dev:https                 # certificado local do Next.js
```

e abra `https://<ip-do-computador>:3000/pdv` no celular (aceite o certificado). Sem câmera, o scanner sempre oferece **Digitar código**.

Formatos lidos: EAN-13, EAN-8, UPC-A, UPC-E e Code 128. No Chrome/Android o sistema usa o `BarcodeDetector` nativo; nos demais (iPhone, desktop), ZXing. Depois de cada leitura há uma trava de ~1 s (e ~2 s para o mesmo código) para não somar a peça duas vezes sem querer. Códigos EAN/UPC digitados têm o dígito verificador conferido.

Teste rápido do cadastro pelo scanner: no PDV, **Escanear produto → Digitar código** e informe um EAN válido que não existe, por exemplo `7891234567888`.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` / `dev:https` | servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm run db:start` | Postgres embutido local (porta 5433, dados em `.pgdata/`) |
| `npm run db:migrate` | nova migration em desenvolvimento |
| `npm run db:deploy` | aplica migrations (produção) |
| `npm run db:seed` | dados de demonstração |
| `npm run db:reset` | recria o banco e roda o seed |
| `npm run db:check` | auditoria de estoque × movimentações |
| `npm run typecheck` / `lint` | TypeScript e ESLint |

## Deploy (GitHub → Vercel + Neon)

1. Crie um projeto no **Neon** e copie a connection string *pooled* (`...-pooler...neon.tech/...?sslmode=require`).
2. Importe o repositório na **Vercel**.
3. Em *Storage*, crie um **Vercel Blob** e conecte ao projeto (gera `BLOB_READ_WRITE_TOKEN`).
4. Em *Environment Variables*, defina:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | connection string do Neon |
| `AUTH_SECRET` | gere com `npx auth secret` |
| `AUTH_TRUST_HOST` | `true` |
| `BLOB_READ_WRITE_TOKEN` | criado pelo Vercel Blob |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | só para o seed inicial |

5. Aplique as migrations e crie a administradora (uma vez, do seu computador, com a `DATABASE_URL` do Neon no ambiente):

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." SEED_ADMIN_PASSWORD="uma-senha-forte" npm run db:seed
```

O seed também cria o catálogo de demonstração. Para produção real, apague os produtos de demonstração pelo painel (ou adapte `prisma/seed.ts` para criar só a loja, a usuária e as categorias).

Nunca envie `.env.local` para o GitHub — ele já está no `.gitignore`; use `.env.example` como referência.

## Estrutura

```
src/
  app/
    (store)/            loja: home, categorias, produto, sacola, checkout, pedido, conta, favoritos
    admin/              painel: dashboard, produtos, categorias, pedidos, vendas, estoque,
                        clientes, cupons, marketing, relatórios, configurações
    pdv/                PDV (carrinho, pagamento) e scanner
    api/                auth, barcode/[code], uploads
    manifest.ts, icon.tsx, icons/[name]   PWA
  actions/              Server Actions (validação Zod → permissão → service → revalidate)
  services/             regras de negócio e acesso ao banco (product, inventory, sale, order,
                        coupon, customer, barcode, pricing, payment, report, store, upload)
  lib/                  prisma, auth, permissões, validações Zod, dinheiro, datas, variantes
  components/           ui (shadcn), shared, store, admin, pdv
  hooks/                use-barcode-scanner, use-is-client
prisma/                 schema.prisma, migrations, seed.ts
scripts/                dev-db.mjs (Postgres embutido), check-stock.ts (auditoria)
```

## Perfis e permissões

O banco já tem os papéis `ADMIN`, `MANAGER`, `SELLER` e `STOCK`, e cada tela/ação confere a permissão (`src/lib/permissions.ts`):

- **Administradora:** tudo
- **Gerente:** tudo, exceto configurações
- **Vendedora:** PDV, scanner, clientes
- **Estoque:** produtos, scanner, estoque

Novos usuários são criados em **Configurações → Equipe**.

## PWA

Painel, PDV e scanner podem ser instalados na tela inicial do celular (manifesto com `display: standalone`, tema `#87977C`, fundo `#F7F3EB`, atalhos para Scanner, PDV e Painel). O service worker (`public/sw.js`, ativo só em produção) guarda os arquivos estáticos e a última versão das páginas visitadas; nunca intercepta Server Actions, `/api` ou envios de formulário.

## Dados de demonstração

Tudo que o seed cria é **fictício**: produtos, preços, clientes (`@example.com`), cupons (`BEMVINDA10`, `GAZZETA20`) e ~75 dias de vendas e pedidos gerados pelos próprios serviços do sistema — por isso o estoque de cada variante é explicado pelas movimentações. Enquanto isso, o painel e o rodapé da loja mostram um aviso de “dados de demonstração”; defina `NEXT_PUBLIC_DEMO_DATA=false` nas variáveis da Vercel quando o catálogo real estiver no ar. Os produtos não têm fotos: a loja mostra ilustrações por categoria até você enviar as fotos reais em **Produtos → Mídia** (ou a foto da vitrine em **Configurações**). Frete fixo (R$ 19,90, grátis acima de R$ 299) e parcelamento (até 6x, parcela mínima R$ 25) são valores de exemplo, editáveis em **Configurações**.

## Próximos passos sugeridos

- Gateway de pagamento online (Pix/cartão) com webhook em `app/api/webhooks/` para marcar pedidos como pagos automaticamente — hoje a loja confirma o pagamento no painel.
- Cálculo de frete por CEP (Correios/Melhor Envio).
- Pagamento dividido no PDV: o banco e o serviço (`resolvePayments`) já aceitam várias formas por venda; falta a interface.
- Contas de cliente na loja (hoje o acompanhamento é por e-mail + número do pedido).
