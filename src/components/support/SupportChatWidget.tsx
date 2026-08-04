"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupportChatPanel } from "@/context/SupportChatContext";
import { SUPPORT_WELCOME, type SupportMessage } from "@/lib/supportChat";
import { useSupportChat } from "@/lib/useSupportChat";

function formatChatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function SupportIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatBubble({ msg }: { msg: SupportMessage }) {
  const isUser = msg.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[82%] px-3 py-2 shadow-sm ${
          isUser
            ? "rounded-2xl rounded-br-sm bg-[#dcf8c6] text-gray-900 dark:bg-brand-600 dark:text-white"
            : "rounded-2xl rounded-bl-sm bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        {msg.kind === "error_report" && isUser && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-error-600 dark:text-error-300">
            Report
          </p>
        )}
        {msg.image_url && (
          <a
            href={msg.image_url}
            target="_blank"
            rel="noreferrer"
            className="mb-2 block overflow-hidden rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={msg.image_url}
              alt={msg.image_name ?? "Attachment"}
              className="max-h-40 w-full object-cover"
            />
          </a>
        )}
        {msg.body && (
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
            {msg.body}
          </p>
        )}
        <p
          className={`mt-1 text-right text-[10px] ${
            isUser
              ? "text-gray-500 dark:text-white/60"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {formatChatTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function SupportChatWidget() {
  const { user } = useAuth();
  const { isOpen, open, close } = useSupportChatPanel();
  const { messages, loading, send } = useSupportChat();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayMessages = useMemo(() => {
    if (messages.length === 0) return [SUPPORT_WELCOME];
    return messages;
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [displayMessages.length, isOpen]);

  function submitMessage() {
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Type a message to send.");
      return;
    }

    setSubmitting(true);
    try {
      send({
        body: trimmed,
        kind: "message",
      });
      setBody("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submitMessage();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={open}
          className="fixed bottom-6 right-6 z-[99990] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-theme-lg transition hover:brightness-95"
          aria-label="Open HMS support chat"
          title="HMS Support"
        >
          <SupportIcon />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[99990] flex h-[min(560px,calc(100vh-3rem))] w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#e5ddd5] shadow-theme-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="flex shrink-0 items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              H
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">HMS Support</p>
              <p className="text-[11px] text-white/75">
                Online · Ask anything
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
              aria-label="Close support chat"
            >
              ✕
            </button>
          </div>

          <div
            className="flex min-h-0 flex-1 flex-col bg-[#e5ddd5] dark:bg-gray-950"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          >
            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
              {loading ? (
                <p className="text-center text-theme-sm text-gray-600">
                  Loading…
                </p>
              ) : (
                displayMessages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <p className="shrink-0 bg-red-50 px-3 py-1.5 text-center text-theme-xs text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </p>
            )}

            <form
              onSubmit={onSubmit}
              className="flex shrink-0 items-center gap-2 border-t border-gray-300/80 bg-[#f0f0f0] px-2 py-2 dark:border-gray-800 dark:bg-gray-900"
            >
              <input
                ref={inputRef}
                type="text"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={onKeyDown}
                placeholder="Type a message…"
                className="min-w-0 flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-[13px] text-gray-900 shadow-sm outline-none ring-0 placeholder:text-gray-400 focus:ring-2 focus:ring-[#25D366]/40 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:brightness-95 disabled:opacity-40"
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </form>
          </div>

          <p className="shrink-0 bg-[#f0f0f0] px-3 pb-2 text-center text-[10px] text-gray-500 dark:bg-gray-900 dark:text-gray-500">
            Signed in as {user?.name ?? "Staff"} · Use Report to send screenshots
          </p>
        </div>
      )}
    </>
  );
}
