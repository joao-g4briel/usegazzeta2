import type { VariantKind } from "@/lib/constants";

// Desenhos de traço fino que ocupam o lugar da foto enquanto o produto não tem imagem.
// O preenchimento usa a cor da variante (ex.: vestido amarelo → véu amarelo).

type ArtProps = { tint?: string | null; className?: string };

const STROKE = "var(--ug-olive)";
const GOLD = "var(--ug-gold)";

function DressArt({ tint, className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <path
        d="M54 22C50 34 46 48 48 62C42 88 34 112 26 138C36 144 44 134 54 140C64 146 72 134 82 140C88 143 92 140 94 138C86 112 78 88 72 62C74 48 70 34 66 22C62 26 58 26 54 22Z"
        fill={tint ?? "var(--ug-paper)"}
        fillOpacity={tint ? 0.55 : 0.7}
      />
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M54 22C56 15 64 15 66 22" stroke={GOLD} />
        <path d="M54 22C50 34 46 48 48 62" />
        <path d="M66 22C70 34 74 48 72 62" />
        <path d="M48 62C54 65.5 66 65.5 72 62" />
        <path d="M48 62C42 88 34 112 26 138" />
        <path d="M72 62C78 88 86 112 94 138" />
        <path d="M26 138C36 144 44 134 54 140C64 146 72 134 82 140C88 143 92 140 94 138" />
        <path d="M34 110C46 117 74 117 86 110" opacity="0.7" />
        <path d="M57.5 25L56.5 36M62.5 25L63.5 36M60 26V38" opacity="0.55" />
      </g>
    </svg>
  );
}

function TopArt({ tint, className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <path d="M40 62C48 58 72 58 80 62L84 104C70 109 50 109 36 104Z" fill={tint ?? "var(--ug-paper)"} fillOpacity={tint ? 0.55 : 0.7} />
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M46 61L50 36M74 61L70 36" stroke={GOLD} />
        <path d="M40 62C48 58 72 58 80 62" />
        <path d="M40 62L36 104M80 62L84 104" />
        <path d="M36 104C50 109 70 109 84 104" />
        <path d="M42 74C48 71 54 77 60 74C66 71 72 77 78 74" opacity="0.5" />
        <path d="M41 85C47 82 53 88 60 85C67 82 73 88 80 85" opacity="0.5" />
        <path d="M39 96C46 93 53 99 60 96C67 93 74 99 81 96" opacity="0.5" />
      </g>
    </svg>
  );
}

function SetArt({ tint, className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <g fill={tint ?? "var(--ug-paper)"} fillOpacity={tint ? 0.55 : 0.7}>
        <path d="M44 34C52 30 68 30 76 34L78 58C66 61 54 61 42 58Z" />
        <path d="M44 70H76L88 136C70 140 50 140 32 136Z" />
      </g>
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M44 34C52 30 68 30 76 34L78 58C66 61 54 61 42 58Z" />
        <path d="M60 32V60" opacity="0.5" />
        <path d="M44 70H76L88 136C70 140 50 140 32 136Z" />
        <path d="M44 77H76" stroke={GOLD} />
        <path d="M52 77L46 137M60 77V139M68 77L74 137" opacity="0.5" />
      </g>
    </svg>
  );
}

function SkirtArt({ tint, className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <path d="M40 42H80L94 134C72 141 48 141 26 134Z" fill={tint ?? "var(--ug-paper)"} fillOpacity={tint ? 0.55 : 0.7} />
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 42H80L94 134C72 141 48 141 26 134Z" />
        <path d="M40 52H80" stroke={GOLD} />
        <path d="M50 52L40 138M60 52V140M70 52L80 138" opacity="0.5" />
      </g>
    </svg>
  );
}

function BlouseArt({ tint, className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <path
        d="M36 46L50 38C54 44 66 44 70 38L84 46L94 66L82 72L80 64V130H40V64L38 72L26 66Z"
        fill={tint ?? "var(--ug-paper)"}
        fillOpacity={tint ? 0.4 : 0.7}
      />
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 46L50 38C54 44 66 44 70 38L84 46L94 66L82 72L80 64V130H40V64L38 72L26 66Z" />
        <path d="M50 38C54 47 66 47 70 38" stroke={GOLD} />
        <path d="M40 80H80M40 94H80M40 108H80M40 122H80" opacity="0.45" />
      </g>
    </svg>
  );
}

// Roupas: o desenho segue o tipo da peça pelo nome (conjunto, cropped, saia, blusa, vestido).
export type ApparelShape = "dress" | "top" | "set" | "skirt" | "blouse";

export function apparelShape(name?: string | null): ApparelShape {
  const n = (name ?? "").toLowerCase();
  if (/conjunto/.test(n)) return "set";
  if (/cropped|\btop\b|bustiê|bustie|body|regata/.test(n)) return "top";
  if (/blusa|camis|t-shirt/.test(n)) return "blouse";
  if (/saia/.test(n)) return "skirt";
  return "dress";
}

function BottleArt({ tint, className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <path
        d="M34 46H86C90 46 92 49 92 53V132C92 138 88 142 82 142H38C32 142 28 138 28 132V53C28 49 30 46 34 46Z"
        fill={tint ?? "#f3d9cf"}
        fillOpacity={0.55}
      />
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="47" y="16" width="26" height="20" rx="3" stroke={GOLD} />
        <path d="M52 22H68M52 28H68" stroke={GOLD} opacity="0.6" />
        <path d="M54 36V46M66 36V46" />
        <path d="M34 46H86C90 46 92 49 92 53V132C92 138 88 142 82 142H38C32 142 28 138 28 132V53C28 49 30 46 34 46Z" />
        <path d="M36 58V126" opacity="0.45" />
        <rect x="44" y="80" width="32" height="26" rx="2" opacity="0.8" />
        <path d="M51 90H69M54 96H66" opacity="0.6" />
      </g>
    </svg>
  );
}

function MakeArt({ tint, className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <circle cx="84" cy="110" r="24" fill="#f6e6e1" fillOpacity="0.85" />
      <path d="M36 70V52C36 46 41 40 52 36V70Z" fill={tint ?? "#c9787a"} fillOpacity={0.7} />
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="31" y="84" width="26" height="58" rx="3" />
        <rect x="33.5" y="70" width="21" height="14" rx="1.5" stroke={GOLD} />
        <path d="M36 70V52C36 46 41 40 52 36V70" />
        <path d="M31 96H57" opacity="0.5" />
        <circle cx="84" cy="110" r="24" />
        <circle cx="84" cy="110" r="17" opacity="0.7" />
        <path d="M72 101C77 97 83 96 88 98" stroke={GOLD} opacity="0.8" />
        <path d="M60 110H63" />
      </g>
    </svg>
  );
}

function AccessoryArt({ tint, className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <g stroke={tint ?? GOLD} strokeWidth="2.2" strokeLinecap="round">
        <circle cx="46" cy="98" r="24" />
        <circle cx="78" cy="104" r="20" />
      </g>
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M46 74C46 62 52 56 56 48" />
        <path d="M78 84C78 74 83 69 86 62" />
        <circle cx="56" cy="46" r="2.2" />
        <circle cx="86" cy="60" r="2" />
      </g>
    </svg>
  );
}

function OtherArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" aria-hidden>
      <g stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 62H90L84 134H36Z" />
        <path d="M46 62C46 46 52 38 60 38C68 38 74 46 74 62" stroke={GOLD} />
        <path d="M44 80H76" opacity="0.5" />
      </g>
    </svg>
  );
}

export function ProductArt({
  kind,
  tint,
  className,
  hint,
}: {
  kind: VariantKind;
  tint?: string | null;
  className?: string;
  hint?: string | null;
}) {
  switch (kind) {
    case "APPAREL": {
      const shape = apparelShape(hint);
      if (shape === "top") return <TopArt tint={tint} className={className} />;
      if (shape === "set") return <SetArt tint={tint} className={className} />;
      if (shape === "skirt") return <SkirtArt tint={tint} className={className} />;
      if (shape === "blouse") return <BlouseArt tint={tint} className={className} />;
      return <DressArt tint={tint} className={className} />;
    }
    case "FRAGRANCE":
      return <BottleArt tint={tint} className={className} />;
    case "BEAUTY":
      return <MakeArt tint={tint} className={className} />;
    case "ACCESSORY":
      return <AccessoryArt tint={tint} className={className} />;
    default:
      return <OtherArt className={className} />;
  }
}

export const KIND_FIELDS: Record<VariantKind, string> = {
  APPAREL: "bg-sage-light",
  BEAUTY: "bg-rose-mist",
  FRAGRANCE: "bg-[#efe4d4]",
  ACCESSORY: "bg-cream",
  OTHER: "bg-linen",
};
