export type SupportMessage = {
  id: string;
  sender: "user" | "provider";
  body: string;
  page_url?: string;
  page_label?: string;
  kind: "message" | "error_report";
  created_at: string;
};

const STORAGE_KEY = "hms-support-chat-v1";

let messages: SupportMessage[] = [];
const listeners = new Set<() => void>();

function uid() {
  return crypto.randomUUID();
}

function readMessages(): SupportMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupportMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(next: SupportMessage[]) {
  messages = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  messages = readMessages();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): SupportMessage[] {
  return messages;
}

export function getServerSnapshot(): SupportMessage[] {
  return [];
}

export function listSupportMessages(): SupportMessage[] {
  return [...messages];
}

export function sendSupportMessage(input: {
  body: string;
  page_url?: string;
  page_label?: string;
  kind?: SupportMessage["kind"];
}): SupportMessage {
  const trimmed = input.body.trim();
  if (!trimmed) throw new Error("Message cannot be empty");

  const userMessage: SupportMessage = {
    id: uid(),
    sender: "user",
    body: trimmed,
    page_url: input.page_url,
    page_label: input.page_label,
    kind: input.kind ?? "message",
    created_at: new Date().toISOString(),
  };

  const providerReply: SupportMessage = {
    id: uid(),
    sender: "provider",
    body:
      input.kind === "error_report"
        ? "Thanks for reporting this. Our support team has received your error report and will follow up shortly."
        : "Thanks for your message. A support agent will respond as soon as possible.",
    kind: "message",
    created_at: new Date(Date.now() + 1000).toISOString(),
  };

  persist([...messages, userMessage, providerReply]);
  return userMessage;
}
