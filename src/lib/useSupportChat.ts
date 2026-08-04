"use client";

import { useCallback, useSyncExternalStore } from "react";
import * as supportChat from "@/lib/supportChat";

const alwaysTrue = () => true;
const alwaysFalse = () => false;

export function useSupportChat() {
  const messages = useSyncExternalStore(
    supportChat.subscribe,
    supportChat.getSnapshot,
    supportChat.getServerSnapshot,
  );

  const hydrated = useSyncExternalStore(
    supportChat.subscribe,
    alwaysTrue,
    alwaysFalse,
  );

  const send = useCallback(
    (input: Parameters<typeof supportChat.sendSupportMessage>[0]) => {
      return supportChat.sendSupportMessage(input);
    },
    [],
  );

  return {
    messages,
    loading: !hydrated,
    send,
  };
}
