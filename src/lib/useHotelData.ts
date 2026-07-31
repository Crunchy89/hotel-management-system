"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { formatError } from "@/lib/api";
import * as store from "@/lib/store";

const alwaysTrue = () => true;
const alwaysFalse = () => false;

/**
 * Subscribes to the localStorage-backed store. Every page reading through this
 * hook re-renders as soon as any mutation lands, so no manual refetching.
 */
export function useHotelData() {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  // False during SSR and the first hydration pass, true once mounted.
  const hydrated = useSyncExternalStore(
    store.subscribe,
    alwaysTrue,
    alwaysFalse,
  );

  const [error, setError] = useState("");

  /** Runs a mutation and surfaces any validation error it throws. */
  const mutate = useCallback(async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError("");
      return true;
    } catch (err) {
      setError(formatError(err));
      return false;
    }
  }, []);

  const reload = useCallback(async () => {
    store.refresh();
  }, []);

  return {
    ...snapshot,
    loading: !hydrated,
    error,
    setError,
    reload,
    mutate,
  };
}
