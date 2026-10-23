import { useSyncExternalStore } from "react";
import { useSelector } from "react-redux";

const noopSubscribe = () => () => {};

// False on the server and during hydration, true afterwards (and immediately
// for components mounted later, e.g. after a client-side navigation).
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

// Persisted redux state (MyList, ContinueWatching, CurrentState...) only exists
// in the browser's localStorage. The server and the first client render must
// agree, so until the store has rehydrated and React has hydrated, consumers
// see the same empty state the server rendered.
export function usePersistedReady() {
  const hydrated = useHydrated();
  const rehydrated = useSelector((state: any) => state._persist?.rehydrated ?? false);
  return hydrated && rehydrated;
}

export function usePersistedState<T>(key: string, fallback: T): { value: T; ready: boolean } {
  const ready = usePersistedReady();
  const stored = useSelector((state: any) => state[key]) as T | undefined;
  return { value: ready ? stored ?? fallback : fallback, ready };
}
