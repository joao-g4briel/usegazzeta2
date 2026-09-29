---
version: 1
slug: "src-app-admin-layout-tsx"
primary_target: "src/app/admin/layout.tsx"
related_targets: ["src/app/pdv/page.tsx"]
---

# Surface: Painel administrativo + PDV + Scanner

Mode: Operate. Users: owner (desktop and phone), sellers at the counter (phone, one hand, bright daylight), stock staff.
Tasks: scan-and-sell in few taps; register unknown barcodes on the spot; manage products by variant; see low stock per variant; update order status; read sales.

## Direction contract

THESIS: Calm boutique back-office where the variant is always visible. Refuses the generic blue SaaS dashboard; every list, cart line and alert names color/size/volume/tone.
OWN-WORLD: Creme sidebar with olive wordmark, sage-light active pill, off-white content, beige hairline tables, olive primary buttons, rosé for alerts, gold only for tiny accents; Manrope throughout with Cormorant page titles; tabular numerals.
STORY: Seller opens PDV, taps ESCANEAR, products land in the cart with haptic feedback, picks Pix or cash (change computed), finishes; owner sees the dashboard move.
FIRST VIEWPORT: PDV on phone: olive header (voltar, wordmark, "PDV • Venda presencial"), giant ESCANEAR PRODUTO button, search, cart lines with photo frame, variant line and steppers, summary, payment tiles, sticky FINALIZAR VENDA.
FORM: Owner-pinned mockups (PDV cart, scanner quick-register, products admin, dashboard). Seed key f49571fe. Raise from provenance ribbon: movement history per variant with before/after as a readable timeline.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
