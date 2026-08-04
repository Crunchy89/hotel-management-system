export type SupportMessage = {
  id: string;
  sender: "user" | "provider";
  body: string;
  page_url?: string;
  page_label?: string;
  kind: "message" | "error_report";
  image_url?: string;
  image_name?: string;
  created_at: string;
};

const STORAGE_KEY = "hms-support-chat-v2";

let messages: SupportMessage[] = [];
const listeners = new Set<() => void>();

function uid() {
  return crypto.randomUUID();
}

function readMessages(): SupportMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("hms-support-chat-v1");
      if (legacy) {
        const parsed = JSON.parse(legacy) as SupportMessage[];
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    }
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

const CHAT_REPLIES = [
  "Thanks for your message! A support agent will reply as soon as possible.",
  "Got it — we're looking into this for you.",
  "Thanks for reaching out. We'll get back to you shortly.",
  "Understood. Our team has noted your question.",
];

function providerReplyFor(input: {
  kind: SupportMessage["kind"];
  body: string;
}): string {
  if (input.kind === "error_report") {
    return "We've received your report. Our team will review the details and follow up with you shortly.";
  }

  const lower = input.body.toLowerCase();
  if (lower.includes("?") || lower.startsWith("how") || lower.startsWith("what")) {
    return "Good question! A support specialist will answer you as soon as possible.";
  }

  return CHAT_REPLIES[Math.floor(Math.random() * CHAT_REPLIES.length)]!;
}

export function sendSupportMessage(input: {
  body: string;
  page_url?: string;
  page_label?: string;
  kind?: SupportMessage["kind"];
  image_url?: string;
  image_name?: string;
}): SupportMessage {
  const trimmed = input.body.trim();
  if (!trimmed && !input.image_url) {
    throw new Error("Add a message or attach an image");
  }

  const kind = input.kind ?? "message";

  const userMessage: SupportMessage = {
    id: uid(),
    sender: "user",
    body: trimmed || (input.image_name ? `[Image: ${input.image_name}]` : ""),
    page_url: input.page_url,
    page_label: input.page_label,
    kind,
    image_url: input.image_url,
    image_name: input.image_name,
    created_at: new Date().toISOString(),
  };

  const providerReply: SupportMessage = {
    id: uid(),
    sender: "provider",
    body: providerReplyFor({ kind, body: trimmed }),
    kind: "message",
    created_at: new Date(Date.now() + 800).toISOString(),
  };

  persist([...messages, userMessage, providerReply]);
  return userMessage;
}

export const SUPPORT_WELCOME: SupportMessage = {
  id: "welcome",
  sender: "provider",
  body: "Hi! 👋 Ask us anything about HMS — setup, billing, features, or how something works.",
  kind: "message",
  created_at: new Date(0).toISOString(),
};
