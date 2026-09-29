# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Pinned by the owner's brief: a single full-stack Next.js 16 (App Router) project in TypeScript, Tailwind CSS, shadcn/ui, Lucide, Prisma 7 on PostgreSQL (Neon in production), Auth.js, Zod, React Hook Form, Recharts, ZXing for barcode reading, Vercel Blob for images, deployed on Vercel from GitHub. No separate backend. Local development runs an embedded Postgres (owner's choice) instead of Neon.

## Users

- **The owner/administrator** of Use Gazzeta, a small women's boutique in Brazil. Manages catalog, stock, orders, customers, coupons and reports from desktop and phone.
- **In-store sellers** at the counter, phone in one hand and product in the other, scanning barcodes and closing sales in a few taps.
- **Stock staff** receiving goods, registering new items by scanning their barcode, counting and adjusting stock.
- **Online shoppers**, mostly women on mobile, browsing clothes, make-up and perfume and ordering for delivery anywhere in Brazil.

## Product Purpose

One system where the online store, the admin panel and the in-store point of sale (PDV) share one catalog, one stock and one customer base, so a piece sold at the counter is immediately unavailable online and vice versa. Success: the owner never oversells the last unit, a seller can scan-and-sell without training, and a new product can be registered straight from its barcode at the counter.

## Positioning

A boutique-owned system shaped around how this store actually sells: the physical counter and the phone camera are first-class, not an afterthought bolted onto an e-commerce template. Every sellable thing is a variant (color/size, volume, tone) with its own barcode and stock.

## Operating Context

- Counter sales in a small shop in bright daylight, often one-handed on a phone; tablets and desktop also used.
- Barcodes: EAN-13, EAN-8, UPC-A, UPC-E and Code 128, read by the phone's rear camera; manual entry as fallback.
- Payment at the counter by Pix, cash (with change), credit, debit or other; split payments must remain possible later.
- Online orders move through: Aguardando pagamento, Pago, Em separação, Enviado, Entregue, Cancelado. Cancelling returns stock.
- The admin and PDV are installable as a PWA on the owner's phone.

## Capabilities and Constraints

- Product = model; ProductVariant = the sellable item. Barcode, SKU, stock, sales and orders always reference the variant. Product total stock is always the sum of its variants and is never stored.
- Barcode is unique across the whole catalog; duplicate registration is refused with "Este código de barras já pertence a outro produto."
- Every stock change writes an inventory movement (ENTRADA, VENDA_PDV, VENDA_ONLINE, AJUSTE, DEVOLUCAO, CANCELAMENTO, PERDA) with before/after quantities, user and reference.
- Stock can never go negative by default; sales and orders are transactional and re-check stock on the server.
- Prices, discounts and stock are always recomputed on the server; the client is never trusted.
- Roles prepared: ADMIN, MANAGER, SELLER, STOCK. ADMIN is implemented first.
- Interface language: Brazilian Portuguese. Currency BRL. Store timezone America/Sao_Paulo.
- Undecided: payment gateway for online orders (orders are created as awaiting payment and confirmed by the admin), real shipping calculation (a flat rate and free-shipping threshold are configurable demo values).

## Brand Commitments

- Name: USE GAZZETA. Feminine, elegant, sophisticated, modern boutique; delicate, editorial, minimal, accessible, organized. Never tech/futuristic, neon, gamer, generic corporate or default SaaS blue.
- Palette pinned by the owner: sálvia #87977C, oliva #5F735B, verde claro #DCE4D6, creme #F7F3EB, off-white #FCFAF6, bege #E9DDCD, rosé #E8C1B8, dourado #C69B4A (detail only, never in excess), texto #171A18, cinza #777A76.
- Type pinned by the owner: an elegant serif for titles (Cormorant Garamond / Playfair Display / DM Serif Display), a clean sans for interface (Inter / Manrope / DM Sans). The store may be more editorial and serif-led; the admin is mainly sans-serif. The word "brilhar" in the hero may use an elegant handwritten script.
- Five owner-supplied mockups (PDV cart, scanner quick-register, admin products, store home, admin dashboard) define the intended look.
- Store copy given by the owner: hero "Moda, make & perfume para você brilhar"; subtext "Peças que valorizam o seu estilo, makes que realçam sua beleza e perfumes que deixam sua marca."; benefits "Peças a partir de R$10", "Enviamos para todo o Brasil", "Compra segura e facilitada"; category lines "Looks para todas as ocasiões", "Realce o que te faz única", "Fragrâncias que deixam a sua marca".

## Evidence on Hand

- No product photography or logo files are to be used for now (owner's decision): the old static site's photos and logo in git history stay out. Products without images show a designed placeholder until real photos are uploaded.
- Demo catalog, prices, customers and orders in the seed are fictitious and must be labeled as demo data; they are not real sales figures.
- No testimonials, ratings, customer counts or press exist. Do not invent star ratings, review counts or "mais de 2 mil clientes" style claims.

## Product Principles

1. The variant is the unit of truth: scanner, cart, stock, sale and order all speak variant.
2. Speed at the counter beats completeness: scan, add, receive, finish, in as few taps as possible.
3. One stock, visible everywhere: store, panel, PDV and scanner always show the same number.
4. Nothing changes without a trail: every stock change is explained by a movement.
5. The store sells with elegance; the panel stays calm, organized and plain-spoken.

## Accessibility & Inclusion

WCAG 2.1 AA contrast for text; large touch targets (at least 44px) on PDV and scanner for one-handed use; vibration and visual feedback on scan; every action gives clear Portuguese feedback.
