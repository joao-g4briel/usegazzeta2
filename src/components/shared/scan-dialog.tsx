"use client";

import { useState, type ReactNode } from "react";
import { ScanBarcode } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarcodeScanner } from "@/components/shared/barcode-scanner";
import { Button } from "@/components/ui/button";

// Botão que abre a câmera para preencher um campo de código de barras.
export function ScanButton({
  onCode,
  label = "Ler código com a câmera",
  trigger,
}: {
  onCode: (code: string) => void;
  label?: string;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="icon" aria-label={label}>
            <ScanBarcode />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border-none bg-paper p-3">
        <DialogTitle className="px-2 pt-1 font-serif text-xl">Ler código de barras</DialogTitle>
        <DialogDescription className="sr-only">Aponte a câmera para o código de barras.</DialogDescription>
        <BarcodeScanner
          active={open}
          compact
          className="aspect-[3/4] w-full"
          onDetect={(code) => {
            onCode(code);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
