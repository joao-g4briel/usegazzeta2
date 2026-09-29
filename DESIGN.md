---
name: Use Gazzeta
description: Boutique store, back-office and counter PDV sharing one catalog; a sage-and-creme shop window with an olive working hand.
colors:
  sage: "#87977C"
  olive: "#5F735B"
  olive-deep: "#4A5B47"
  sage-light: "#DCE4D6"
  sage-mist: "#EEF2EA"
  secondary-ink: "#2D3A2A"
  rose: "#E8C1B8"
  rose-mist: "#F6E6E1"
  rose-deep: "#9A4A3D"
  gold: "#C69B4A"
  gold-ink: "#8A6424"
  gold-mist: "#F5ECD9"
  cream: "#F7F3EB"
  offwhite: "#FCFAF6"
  paper: "#FFFDF9"
  linen: "#F2EBE0"
  beige: "#E9DDCD"
  fragrance-field: "#EFE4D4"
  sidebar-creme: "#F4EFE6"
  hairline: "#E7DFD2"
  input-stroke: "#DED5C6"
  ink: "#171A18"
  stone-ink: "#5F625E"
  stone: "#777A76"
  destructive: "#A8412F"
  chart-grid: "#EEE7DB"
  chart-delivered: "#3E8050"
  chart-transit: "#C9962E"
  chart-processing: "#7A6FB8"
  chart-cancelled: "#C85F73"
typography:
  display:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "clamp(2.9rem, 6vw, 4.6rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.015em"
  script:
    fontFamily: "Allura, cursive"
    fontSize: "1.32em"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1.25
  section:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "2.1rem"
    fontWeight: 500
    lineHeight: 1.25
  title:
    fontFamily: "Cormorant Garamond, Times New Roman, serif"
    fontSize: "1.4rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "\"ss01\" on"
  body-lead:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  numeric:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" on"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  cta-caps:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
rounded:
  sm: "8.4px"
  md: "11.2px"
  lg: "14px"
  xl: "19.6px"
  2xl: "25.2px"
  3xl: "30.8px"
  full: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
  panel: "24px"
  panel-mobile: "20px"
  container: "1320px"
components:
  button-primary:
    backgroundColor: "{colors.olive}"
    textColor: "{colors.offwhite}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.olive-deep}"
  button-soft:
    backgroundColor: "{colors.sage-light}"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.xl}"
    height: "40px"
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.linen}"
  button-destructive:
    backgroundColor: "{colors.rose-mist}"
    textColor: "{colors.rose-deep}"
    rounded: "{rounded.xl}"
    height: "40px"
  cta-pill:
    backgroundColor: "{colors.olive}"
    textColor: "{colors.offwhite}"
    typography: "{typography.cta-caps}"
    rounded: "{rounded.full}"
    padding: "0 32px"
    height: "56px"
  cta-pill-hover:
    backgroundColor: "{colors.olive-deep}"
  scan-button:
    backgroundColor: "{colors.olive}"
    textColor: "{colors.offwhite}"
    rounded: "{rounded.3xl}"
    height: "72px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "4px 12px"
    height: "40px"
  store-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    height: "44px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  category-card:
    backgroundColor: "{colors.sage-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.3xl}"
    padding: "28px"
  nav-item-active:
    backgroundColor: "{colors.sage-light}"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.xl}"
    height: "44px"
  stock-badge-ok:
    backgroundColor: "{colors.sage-mist}"
    textColor: "{colors.olive}"
    rounded: "{rounded.full}"
    height: "24px"
  stock-badge-low:
    backgroundColor: "{colors.gold-mist}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.full}"
    height: "24px"
  stock-badge-out:
    backgroundColor: "{colors.rose-mist}"
    textColor: "{colors.rose-deep}"
    rounded: "{rounded.full}"
    height: "24px"
  payment-tile-selected:
    backgroundColor: "{colors.sage-mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "12px"
---

# Design System: Use Gazzeta

## Overview

**Creative North Star: "The Boutique Window"**

Use Gazzeta is a small Brazilian boutique's own shop window, lookbook and back room in one system. The store is a window dressed in sage, creme and rosé: editorial Cormorant headlines, one flourish of script on "brilhar", products standing under arches with price tags hung from a gold thread. The admin and PDV are the same boutique after hours: creme sidebar, off-white paper panels, beige hairlines, olive hands doing the work, Manrope everywhere a number or a task lives.

The palette is owner-pinned and low-chroma by nature; warmth comes from layered creams (off-white ground, paper cards, linen and cream fields) rather than from saturated color. Olive is the only color that acts; sage frames; rosé and bege tint category fields; gold is jewelry. Depth is a whisper, corners are generous, and every surface stays calm enough that a variant line (cor, tamanho, tom, volume) is always the most legible thing in view.

There are no product photos yet by owner decision, so the placeholder is part of the system: a tinted field with a fine-line drawing of the category and an inset white frame. It is designed to be replaced by photography without changing anything around it. The world refuses tech, neon, gamer, generic corporate and default SaaS blue.

**Key Characteristics:**
- Sage band header over off-white grounds; creme sidebar in the back office; olive for every primary action.
- Cormorant Garamond for titles and display money, Manrope for interface and data, Allura for one word only.
- Generous rounding (14 to 31px) with pills for commerce calls to action and full arches in the shop window.
- Two whisper shadows, beige hairlines, tonal layering between four near-white creams.
- Category-tinted fields with fine-line drawings stand in for photography.

## Colors

A quiet, owner-pinned boutique palette: warm creams carry the space, olive does the work, sage frames, rosé and bege tint, gold decorates.

### Primary
- **Boutique Olive** (olive): every primary action (buttons, CTA pills, ESCANEAR PRODUTO, active filter tabs, avatar, the PDV header band), in-stock text, text caret, links. Offwhite text on olive clears AA.
- **Olive After Hours** (olive-deep): the hover and pressed state of every olive action; never a resting color.
- **Shop-Window Sage** (sage): the store header band, theme color, focus outline and ring, in-stock dots, chart ring. Frames rather than acts.
- **Pressed Sage Leaf** (sage-light): active nav pill, soft buttons, the apparel field, stat-tile icon discs, the admin sidebar sign-off card. Pairs with secondary-ink text.
- **Morning Sage Mist** (sage-mist): selected payment tile, in-stock badge ground, empty-state icon disc, accent hover.

### Secondary
- **Blush Rosé** (rose): OFERTA badge, text selection, chart slice in the brand chart set.
- **Rosé Powder** (rose-mist): the beauty field, destructive button ground, out-of-stock badge ground.
- **Terracotta Rosé** (rose-deep): alert text and dots (sem estoque, últimas unidades, troco em falta, alert count). The system's warning voice; rosé for alerts, not red.

### Tertiary
- **Antique Gold** (gold): the hanging-tag thread and ring, the sparkle on "brilhar", bag count bubble, low-stock dot, and the gold button fill.
- **Gold Leaf Ink** (gold-ink): every gold that must be read as text: "brilhar", Ofertas menu item, benefit icons, low-stock labels, FAVORITO badge.
- **Champagne Mist** (gold-mist): low-stock badge and FAVORITO badge grounds.

### Neutral
- **Off-White Ground** (offwhite): the page background everywhere and the text color on olive.
- **Paper** (paper): cards, panels, inputs, popovers, price tags; one step lighter than the ground so cards lift without shadow.
- **Creme** (cream): the store hero field, PDV cash and installment trays, accessory field.
- **Linen** (linen): muted fills, ghost and outline hover, "other" product field.
- **Bege** (beige): secondary button hover tint; the fragrance family is carried by **Perfume Bege** (fragrance-field), the perfume category field and beige stat-tile disc.
- **Sidebar Creme** (sidebar-creme): the admin sidebar and drawer.
- **Beige Hairline** (hairline): every border and table rule; **Input Stroke** (input-stroke) is one step darker for form fields.
- **Boutique Ink** (ink): all primary text. **Stone Ink** (stone-ink): all secondary text, placeholders and axis labels. **Stone** (stone): decorative only (out-of-stock dot, strikethrough).
- **Destructive Brick** (destructive): the shadcn destructive token for invalid fields and rings.

### Data
Charts use a validated set, not the brand tokens: single-series bars in olive (hover olive-deep) on chart-grid lines with stone-ink axis text; the order-status donut uses chart-delivered, chart-transit, chart-processing and chart-cancelled, separated by 2px paper strokes, with chart-grid for empty. Sage and olive are too low-chroma to carry categorical identity, which is why the donut uses derived steps.

### Named Rules
**The Gold Thread Rule.** Gold is jewelry: threads, rings, a sparkle, a count bubble, a dot. As a fill it appears only on the gold button, at most once per screen. Gold that must be read is always gold-ink.

**The Olive Acts Rule.** Olive is the only color that invites a tap. Sage frames, rosé warns, gold decorates; none of them carries a primary action.

**The Stone-Ink Rule.** Secondary text is stone-ink. The owner's cinza (stone) sits near 4:1 on off-white and is kept for dots and strikethroughs, never for reading text.

**The Sage Band Rule.** Offwhite on sage is only about 3:1, so the sage band carries the wordmark, 44px icon buttons and the paper search pill, never small text set directly on sage.

## Typography

**Display Font:** Cormorant Garamond (with Times New Roman, serif), weights 400 to 700 plus italic
**Body Font:** Manrope (with ui-sans-serif, system-ui), stylistic set ss01 on
**Script:** Allura, for the single word "brilhar"

**Character:** A high-contrast Garamond gives the boutique its editorial voice and turns prices into display pieces; Manrope's geometric calm handles every form, table and count so the back office never feels ornate.

### Hierarchy
- **Display** (Cormorant 500, 2.9rem to 4.6rem, line-height 0.98, -0.015em): the store hero headline only.
- **Script** (Allura 400, 1.32em of its parent): "brilhar" in gold-ink, in the hero, footer and admin sign-off card.
- **Headline** (Cormorant 500, 2.1rem to 2.5rem, 1.25): admin page titles, PDV "Carrinho de venda", product names on product pages.
- **Section** (Cormorant 500, 1.75rem to 2.1rem): store section titles; category-card names at 2rem to 2.35rem, line-height 1.
- **Title** (Cormorant 600, 1.4rem): panel titles, empty-state titles, sheet titles (1.5rem), PDV cart line names (1.2rem to 1.35rem).
- **Body** (Manrope 400, 0.95rem to 1rem, relaxed): descriptions, tables, forms; hero subtext at 1.05rem to 1.125rem capped near 31rem.
- **Numeric** (Manrope 600, tabular, 1.4rem to 1.9rem, -0.01em): stat-tile values; table and price figures use tabular Manrope at body sizes, 700 for store prices.
- **Label** (Manrope 600, 0.8125rem to 0.9rem): buttons, nav items, badges (0.72rem), stock labels (0.68rem 700 uppercase 0.08em).
- **CTA Caps** (Manrope 700, 0.72rem to 1.25rem, uppercase, 0.06em to 0.14em): only on primary commerce and counter actions: COMPRAR AGORA, category-card CTAs, ESCANEAR PRODUTO, purchase-panel add.

### Named Rules
**The One Word Rule.** Allura sets "brilhar" and nothing else.

**The Two Kinds of Money Rule.** Money the customer or seller looks at as a total (PDV line prices, Total da venda) may be set in Cormorant 600 tabular at 1.35rem and up; money in lists, tables, cards and stat tiles is Manrope tabular.

**The Sans Does the Work Rule.** Admin and PDV body, forms, tables and navigation are Manrope; Cormorant is reserved for titles and display totals.

## Layout

The store sits in a centered 1320px container with 16px, 24px and 32px gutters at mobile, tablet (640px) and desktop (1024px). The hero is a two-column split at lg (1.02fr / 1fr): copy left, a three-column shop window of arches right, the side arches dropped 24px and 40px to stagger. Category cards run three across on desktop and stack on mobile; product grids run six across on desktop and two on mobile, with 4:5 frames.

The admin is a 248px sticky creme sidebar plus a 64px to 72px sticky translucent top bar over off-white content with 24px to 32px padding. Stat tiles run four across on desktop, two on mobile. Panels use 20px padding on mobile, 24px from sm. On phones the sidebar becomes a left drawer and a fixed five-slot bottom bar appears, its center PDV slot a raised 52px olive tile.

The PDV is mobile-first: a 68px olive header, a full-width 72px ESCANEAR PRODUTO button (96px at lg), cart lines, summary, payment tiles three across (five from sm), and a sticky FINALIZAR VENDA bar. All counter touch targets are at least 44px. Text blocks wrap with balance on h1 to h3 and pretty on paragraphs.

## Elevation & Depth

The system is tonal first. Depth comes from stacking four creams (off-white ground, paper card, linen or cream tray, hairline border); cards are paper on off-white with a beige hairline and a whisper shadow. A heavier lift appears on hover (product frames, category cards) and on elements that float by nature (hero arches, the mobile PDV center tab). Olive CTAs carry a long soft olive-tinted drop to seat them on creme.

### Shadow Vocabulary
- **Whisper** (`box-shadow: 0 1px 2px rgb(23 26 24 / 0.04), 0 12px 32px -18px rgb(23 26 24 / 0.16)`): panels, stat tiles, price tags at rest.
- **Lift** (`box-shadow: 0 2px 4px rgb(23 26 24 / 0.05), 0 22px 44px -22px rgb(23 26 24 / 0.28)`): hover on product and category cards, hero arches, raised PDV tab.
- **Olive Seat** (`box-shadow: 0 14px 30px -16px rgb(74 91 71 / 0.9)`): the store's primary pill CTA; the scan button uses the deeper `0 18px 34px -20px` variant.

### Named Rules
**The Whisper Rule.** Two shadows only, both soft and ink-tinted with negative spread. Nothing hard, nothing offset, nothing colored except the olive seat under olive actions.

## Shapes

One base radius (14px) scaled into a generous family: 8.4px for extra-small buttons and quick-pick chips, 19.6px for default buttons, inputs, nav items and filter tabs, 25.2px for panels, stat tiles, product frames and payment tiles, 30.8px for category cards and the scan button. Commerce CTAs, the store search, badges and stock pills are full pills. The hero's signature shape is the arch: a fully rounded top with 28px bottom corners, revealed with a clip-path rise. Placeholder fields carry an inset white hairline frame at 7% that inherits the outer radius. Borders are 1px beige hairlines; a selected tile doubles to 2px olive.

## Components

### Buttons
Tactile and quiet: olive fills, soft cream alternatives, a 1px press-down on active.
- **Shape:** gently pill-like (19.6px) at the default 40px height; 25.2px at lg (48px) and xl (56px); 14px at xs and sm.
- **Primary:** olive with offwhite Manrope 600, a faint inner top highlight; hover olive-deep.
- **Soft:** sage-light with secondary-ink; hover one step darker sage.
- **Gold:** gold fill with ink text; the celebratory or "add new" action, one per screen.
- **Outline / Secondary / Ghost:** paper with hairline, linen, or transparent; all hover to linen.
- **Destructive:** rose-mist ground with rose-deep text, never a red slab.
- **Focus:** a 3px sage ring at 40%; globally a 2px sage outline offset 2px.

### Commerce CTA Pill
Olive full pill, 40px to 56px tall, uppercase Manrope 700 tracked 0.12em to 0.14em, trailing arrow that nudges 4px right on hover, olive seat shadow. Used for COMPRAR AGORA and category-card calls to action.

### Chips and Badges
- **Product badges:** 28px full pills, 0.72rem semibold. NOVIDADE olive, OFERTA rosé, ÚLTIMAS PEÇAS ink, FAVORITO gold-mist with gold-ink, others paper.
- **Stock badges:** 24px pills with a 6px dot: sage-mist and olive (normal), gold-mist and gold-ink with gold dot (low), rose-mist and rose-deep (out). Store stock notes use the same dot and tone as inline text.
- **Filter tabs:** 36px, 19.6px radius, paper with hairline; active is olive with offwhite text.

### Cards / Containers
- **Corner Style:** 25.2px for panels and product frames, 30.8px for category cards.
- **Background:** paper on off-white; category cards take their category field.
- **Shadow Strategy:** Whisper at rest, Lift on hover (see Elevation & Depth).
- **Border:** 1px hairline on panels and tiles; category cards and product frames are borderless fields.
- **Internal Padding:** 20px mobile, 24px from sm; category cards 24px to 28px.

### Inputs / Fields
- **Style:** paper ground, 1px input-stroke, 19.6px radius, 40px tall (48px for PDV money fields), olive caret.
- **Focus:** border shifts to sage with a 3px sage ring at 50%.
- **Error / Disabled:** destructive border with a 3px ring at 20%; disabled at 50% opacity.
- **Store search:** a 44px paper pill on the sage band with a stone-ink placeholder, "O que você procura hoje?".

### Navigation
- **Store:** sage band (64px, 72px from sm) with the light wordmark and 44px round icon buttons hovering to 15% white; below it on desktop, an off-white translucent menu row of Manrope 0.9rem items, active marked by olive text and a 1px olive underline, Ofertas in gold-ink. Mobile drawer lists categories in Cormorant 1.45rem.
- **Admin:** creme sidebar, olive wordmark, 44px Manrope items with stone-ink icons; active is a sage-light pill with olive icon. Count bubbles are olive (orders) or gold-mist (low stock).
- **PDV:** olive header with a light wordmark and subtitle ("PDV • Venda presencial"), 44px round back and menu buttons.

### Wordmark and Monogram
A typographic lockup until the official logo arrives: "USE" in Manrope 500 tracked 0.28em at small size, baseline-aligned with "GAZZETA" in Cormorant 500 uppercase tracked 0.09em. Tones: ink, light (on sage and olive), olive (on creme). The "UG" monogram is two overlapped Cormorant light capitals, used at 40% opacity in placeholder corners.

### Product Placeholder
A category field (apparel sage-light, beauty rose-mist, fragrance fragrance-field, accessory cream, other linen) with a fine-line drawing of the category tinted by the variant's first swatch, an inset white hairline frame, a soft olive drop under the drawing, and the monogram at bottom right. Sold-out frames drop to 70% opacity and half saturation.

### Shop-Window Arch
The hero's three featured products stand in arches (fully rounded top, Lift shadow, white ring at 60%), rising in with a clip-path reveal staggered 0, 120 and 240ms. Each carries a paper price tag hanging 20px below on a 1px gold thread with a gold ring, tilted -5deg and swinging to +3deg on hover with a springy ease.

### Payment Tiles
96px to 104px tiles, 25.2px radius, paper with hairline; a large stone-ink stroke icon, Manrope label and hint, and a radio ring at top right. Selected: 2px olive border, sage-mist ground, olive icon, filled olive radio.

### Scanner Viewfinder
A 30.8px rounded window cut out of a 45% ink scrim, a pale-green scan line sweeping on a 2.2s ease, and an inset green flash on a successful read.

## Do's and Don'ts

### Do:
- **Do** use olive for every primary action and olive-deep for its hover.
- **Do** set secondary text in stone-ink and reserve stone for dots and strikethroughs.
- **Do** tint placeholders by category field and fine-line drawing until real photos exist; keep the inset white frame.
- **Do** name the variant (cor, tamanho, tom, volume) on every cart line, stock row and alert, in stone-ink beneath a title.
- **Do** keep shadows to Whisper at rest and Lift on hover or for floating elements.
- **Do** keep counter and scanner touch targets at 44px or larger.
- **Do** respect reduced motion: the arch rise, pop-in and scan line collapse to near-zero duration.

### Don't:
- **Don't** use gold as a surface beyond the single gold button per screen, or set readable text in raw gold.
- **Don't** set small text directly on the sage band.
- **Don't** use Allura for anything but "brilhar".
- **Don't** introduce saturated blues, neon or tech gradients; the world is tech-free and default-SaaS-free.
- **Don't** draw star ratings, review counts or customer-number badges; nothing in the system represents them.
- **Don't** use hard or offset shadows, or colored glows beyond the olive seat and the scanner's green line.
- **Don't** use brand sage or olive steps as categorical chart colors; use the validated status set.
