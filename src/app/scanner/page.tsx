import { redirect } from "next/navigation";

// Atalho curto para instalar no celular: /scanner → /pdv/scanner
export default function ScannerShortcut() {
  redirect("/pdv/scanner");
}
