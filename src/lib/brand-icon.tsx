import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Ícone do app (PWA, favicon): monograma "UG" em Cormorant sobre o sálvia da marca.
const cormorant = readFile(
  join(process.cwd(), "node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff"),
);

export async function brandIcon(size: number, options: { maskable?: boolean; rounded?: boolean } = {}) {
  const font = await cormorant;
  const glyph = Math.round(size * (options.maskable ? 0.42 : 0.56));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#87977C",
          borderRadius: options.rounded ? size * 0.22 : 0,
          color: "#FCFAF6",
          fontFamily: "Cormorant",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", fontSize: glyph, lineHeight: 1 }}>
          <span>U</span>
          <span style={{ marginLeft: -glyph * 0.3, marginTop: glyph * 0.12 }}>G</span>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Cormorant", data: await font, style: "normal", weight: 500 }],
    },
  );
}
