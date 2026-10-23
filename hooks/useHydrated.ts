import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// False on the server and during hydration, true afterwards (and immediately
// for components mounted later). Use it to gate render output that can't match
// the server: the current time, document, browser storage.
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
