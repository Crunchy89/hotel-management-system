"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import * as clientChat from "@/lib/clientChat";
import type { Guest, Reservation } from "@/lib/types";

const alwaysTrue = () => true;
const alwaysFalse = () => false;

export function useClientChat(
  reservations: Reservation[] = [],
  guests: Guest[] = [],
) {
  const messages = useSyncExternalStore(
    clientChat.subscribe,
    clientChat.getSnapshot,
    clientChat.getServerSnapshot,
  );

  const hydrated = useSyncExternalStore(
    clientChat.subscribe,
    alwaysTrue,
    alwaysFalse,
  );

  const seed = useCallback(() => {
    clientChat.seedClientChat(reservations, guests);
  }, [reservations, guests]);

  const send = useCallback(
    (input: Parameters<typeof clientChat.sendClientChatMessage>[0]) => {
      return clientChat.sendClientChatMessage(input);
    },
    [],
  );

  const threads = useMemo(
    () => clientChat.listClientChatThreads(),
    [messages],
  );

  return {
    messages,
    threads,
    loading: !hydrated,
    seed,
    send,
    messagesForReservation: clientChat.messagesForReservation,
  };
}
