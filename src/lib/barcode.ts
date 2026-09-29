// Regras puras de código de barras (usadas no cliente e no servidor).
// Formatos suportados na leitura: EAN-13, EAN-8, UPC-A, UPC-E e Code 128.

export function normalizeBarcode(raw: string): string {
  return raw.replace(/[\s​]+/g, "").trim();
}

function gtinCheckDigitValid(digits: string): boolean {
  // Serve para EAN-8, UPC-A (12) e EAN-13: pesos 3/1 da direita para a esquerda.
  const body = digits.slice(0, -1);
  const check = Number(digits.at(-1));
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const n = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  return (10 - (sum % 10)) % 10 === check;
}

// Expande UPC-E (8 dígitos) para UPC-A (12) para conferir o dígito verificador.
function expandUpcE(upce: string): string | null {
  if (!/^[01]\d{7}$/.test(upce)) return null;
  const ns = upce[0];
  const d = upce.slice(1, 7);
  const check = upce[7];
  const last = d[5];
  let body: string;
  if (last === "0" || last === "1" || last === "2") {
    body = `${d[0]}${d[1]}${last}0000${d[2]}${d[3]}${d[4]}`;
  } else if (last === "3") {
    body = `${d[0]}${d[1]}${d[2]}00000${d[3]}${d[4]}`;
  } else if (last === "4") {
    body = `${d[0]}${d[1]}${d[2]}${d[3]}00000${d[4]}`;
  } else {
    body = `${d[0]}${d[1]}${d[2]}${d[3]}${d[4]}0000${last}`;
  }
  return `${ns}${body}${check}`;
}

export type BarcodeCheck = { valid: true; value: string } | { valid: false; message: string };

export function checkBarcode(raw: string): BarcodeCheck {
  const value = normalizeBarcode(raw);
  if (value.length < 3) return { valid: false, message: "Código de barras muito curto." };
  if (value.length > 48) return { valid: false, message: "Código de barras muito longo." };
  if (!/^[\x21-\x7E]+$/.test(value)) {
    return { valid: false, message: "O código de barras tem caracteres inválidos." };
  }
  if (/^\d+$/.test(value) && [8, 12, 13].includes(value.length)) {
    const okGtin = gtinCheckDigitValid(value);
    const upcA = value.length === 8 ? expandUpcE(value) : null;
    const okUpcE = upcA ? gtinCheckDigitValid(upcA) : false;
    if (!okGtin && !okUpcE) {
      return {
        valid: false,
        message: "Código EAN/UPC inválido: o dígito verificador não confere. Confira os números.",
      };
    }
  }
  return { valid: true, value };
}
