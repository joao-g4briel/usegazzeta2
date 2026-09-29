"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Barcode, CameraOff, Flashlight, FlashlightOff, Keyboard, RefreshCw, SwitchCamera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

const STATUS_TEXT: Record<string, { title: string; body: string }> = {
  denied: {
    title: "Câmera bloqueada",
    body: "Permita o acesso à câmera nas configurações do navegador ou digite o código manualmente.",
  },
  "no-camera": { title: "Nenhuma câmera encontrada", body: "Digite o código de barras manualmente." },
  insecure: {
    title: "A câmera precisa de HTTPS",
    body: "Abra o sistema por https:// (ou localhost) para usar a câmera. Enquanto isso, digite o código.",
  },
  error: { title: "Não foi possível abrir a câmera", body: "Tente novamente ou digite o código." },
};

export function BarcodeScanner({
  active,
  onDetect,
  hint = "Aponte o código de barras do produto",
  className,
  footer,
  compact,
}: {
  active: boolean;
  onDetect: (code: string) => void;
  hint?: string;
  className?: string;
  footer?: ReactNode;
  compact?: boolean;
}) {
  const { videoRef, status, torchSupported, torchOn, toggleTorch, canSwitch, switchCamera, retry, detectedAt } =
    useBarcodeScanner({ active, onDetect });
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!detectedAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- brilho curto de confirmação da leitura
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 650);
    return () => clearTimeout(t);
  }, [detectedAt]);
  const problem = STATUS_TEXT[status];

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    onDetect(value);
    setCode("");
    setManual(false);
  }

  return (
    <div className={cn("relative isolate overflow-hidden rounded-[1.75rem] bg-[#1d211c]", className)}>
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        muted
        playsInline
        aria-label="Imagem da câmera"
      />

      {/* máscara com a janela de leitura */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "relative h-[42%] w-[78%] max-w-md rounded-3xl shadow-[0_0_0_100vmax_rgb(18_20_17/0.45)] transition-[box-shadow] duration-300",
            flash && "shadow-[0_0_0_100vmax_rgb(18_20_17/0.45),inset_0_0_0_3px_#b9d8a8]",
          )}
        >
          {["top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-3xl", "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-3xl", "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-3xl", "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-3xl"].map((c) => (
            <span key={c} className={cn("absolute size-10 border-offwhite", c)} />
          ))}
          {status === "scanning" ? (
            <span className="absolute inset-x-4 top-1/2 h-0.5 animate-scan-line rounded-full bg-[#b9d8a8] shadow-[0_0_14px_2px_rgb(185_216_168/0.8)]" />
          ) : null}
        </div>
      </div>

      <div className={cn("absolute inset-x-0 top-0 flex justify-center p-4", compact && "p-3")}>
        <p className="inline-flex items-center gap-2.5 rounded-full bg-[#2b2a24]/80 px-4 py-2.5 text-sm font-medium text-offwhite backdrop-blur-sm">
          <Barcode className="size-5 shrink-0" />
          {status === "starting" ? "Abrindo a câmera…" : hint}
        </p>
      </div>

      {problem ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1d211c]/92 p-6 text-center text-offwhite">
          <CameraOff className="size-8 text-sage-light" />
          <p className="font-semibold">{problem.title}</p>
          <p className="max-w-xs text-sm text-offwhite/85">{problem.body}</p>
          {status !== "insecure" ? (
            <button
              type="button"
              onClick={() => retry()}
              className="mt-1 inline-flex h-11 items-center gap-2 rounded-full bg-offwhite px-5 text-sm font-semibold text-ink"
            >
              <RefreshCw className="size-4" /> Tentar de novo
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-4">
        {manual ? (
          <form onSubmit={submit} className="flex gap-2 rounded-2xl bg-paper p-2 shadow-lift">
            <input
              autoFocus
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Digite o código de barras"
              aria-label="Código de barras"
              className="h-12 min-w-0 flex-1 rounded-xl bg-linen px-4 text-base tabular outline-none"
            />
            <button type="submit" className="h-12 rounded-xl bg-olive px-5 text-sm font-semibold text-offwhite">
              Buscar
            </button>
          </form>
        ) : (
          <div className="flex items-end justify-between gap-2">
            <button
              type="button"
              onClick={() => setManual(true)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-paper/95 px-4 text-sm font-semibold text-ink shadow-soft"
            >
              <Keyboard className="size-4" /> Digitar código
            </button>
            <div className="flex gap-2">
              {canSwitch ? (
                <button
                  type="button"
                  onClick={switchCamera}
                  aria-label="Trocar câmera"
                  className="inline-flex size-12 items-center justify-center rounded-full bg-[#2b2a24]/85 text-offwhite backdrop-blur-sm"
                >
                  <SwitchCamera className="size-5" />
                </button>
              ) : null}
              {torchSupported ? (
                <button
                  type="button"
                  onClick={toggleTorch}
                  aria-pressed={torchOn}
                  aria-label={torchOn ? "Desligar lanterna" : "Ligar lanterna"}
                  className={cn(
                    "inline-flex size-12 items-center justify-center rounded-full backdrop-blur-sm",
                    torchOn ? "bg-gold text-ink" : "bg-[#2b2a24]/85 text-offwhite",
                  )}
                >
                  {torchOn ? <FlashlightOff className="size-5" /> : <Flashlight className="size-5" />}
                </button>
              ) : null}
            </div>
          </div>
        )}
        {footer}
      </div>
    </div>
  );
}
