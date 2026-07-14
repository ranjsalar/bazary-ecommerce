"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// True only after hydration — safe way to read client-only state (localStorage
// cart) without a server/client HTML mismatch.
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
