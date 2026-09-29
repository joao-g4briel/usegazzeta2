"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Leitura pela câmera traseira: BarcodeDetector nativo quando o navegador suporta
// os formatos (Chrome/Android), senão ZXing. EAN-13, EAN-8, UPC-A, UPC-E e Code 128.

type NativeDetector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string; format: string }[]> };
type NativeDetectorCtor = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats: () => Promise<string[]>;
};

const NATIVE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];

export type ScannerStatus = "idle" | "starting" | "scanning" | "denied" | "no-camera" | "insecure" | "error";

export function useBarcodeScanner({
  active,
  onDetect,
  lockMs = 1000,
  sameCodeMs = 2200,
}: {
  active: boolean;
  onDetect: (code: string) => void;
  lockMs?: number;
  sameCodeMs?: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const onDetectRef = useRef(onDetect);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [engine, setEngine] = useState<"native" | "zxing" | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState<number | null>(null);
  const [detectedAt, setDetectedAt] = useState(0);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  // Trava de ~1s depois de qualquer leitura + janela maior para o mesmo código:
  // evita adicionar a mesma peça várias vezes sem querer.
  const handleCode = useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      const now = Date.now();
      const last = lastRef.current;
      if (now - last.at < lockMs) return;
      if (code === last.code && now - last.at < sameCodeMs) return;
      lastRef.current = { code, at: now };
      setDetectedAt(now);
      if ("vibrate" in navigator) navigator.vibrate?.(60);
      onDetectRef.current(code);
    },
    [lockMs, sameCodeMs],
  );

  const stop = useCallback(() => {
    stopLoopRef.current?.();
    stopLoopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorchOn(false);
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus("insecure");
      return;
    }
    setStatus("starting");
    stop();
    try {
      const deviceId = deviceIndex !== null ? devices[deviceIndex]?.deviceId : undefined;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      await video.play().catch(() => {});

      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(Boolean(caps.torch));

      const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
      setDevices(list);

      const Native = (window as unknown as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector;
      let usedNative = false;
      if (Native) {
        const supported = await Native.getSupportedFormats().catch(() => [] as string[]);
        const formats = NATIVE_FORMATS.filter((f) => supported.includes(f));
        if (formats.length >= 3) {
          const detector = new Native({ formats });
          let alive = true;
          const tick = async () => {
            if (!alive) return;
            if (video.readyState >= 2) {
              try {
                const found = await detector.detect(video);
                if (found[0]?.rawValue) handleCode(found[0].rawValue);
              } catch {
                // quadro inválido: tenta no próximo
              }
            }
            if (alive) setTimeout(tick, 110);
          };
          tick();
          stopLoopRef.current = () => {
            alive = false;
          };
          usedNative = true;
          setEngine("native");
        }
      }

      if (!usedNative) {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        const controls = await reader.decodeFromVideoElement(video, (result) => {
          if (result) handleCode(result.getText());
        });
        stopLoopRef.current = () => controls.stop();
        setEngine("zxing");
      }
      setStatus("scanning");
    } catch (error) {
      const name = (error as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") setStatus("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError") setStatus("no-camera");
      else setStatus("error");
    }
  }, [deviceIndex, devices, handleCode, stop]);

  /* eslint-disable react-hooks/set-state-in-effect -- liga/desliga a câmera (sistema externo) conforme `active` */
  useEffect(() => {
    if (!active) {
      stop();
      setStatus("idle");
      return;
    }
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia só ao ativar ou trocar de câmera
  }, [active, deviceIndex]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn]);

  const switchCamera = useCallback(() => {
    if (devices.length < 2) return;
    setDeviceIndex((i) => ((i ?? 0) + 1) % devices.length);
  }, [devices.length]);

  return {
    videoRef,
    status,
    engine,
    torchSupported,
    torchOn,
    toggleTorch,
    canSwitch: devices.length > 1,
    switchCamera,
    retry: start,
    detectedAt,
    submitManual: handleCode,
  };
}
