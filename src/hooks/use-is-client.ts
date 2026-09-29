"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false no servidor e durante a hidratação; true depois. Evita divergência de HTML
// para dados que só existem no navegador (sacola, favoritos).
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
