"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { Alert, Field, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { EmptyState, PageShell, PageSectionNav, SurfaceCard, TwoColumnLayout } from "@/components/ui/layout";
import { useAuth } from "@/context/AuthContext";
import { useSupportChat } from "@/lib/useSupportChat";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function ChatPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { messages, loading, send } = useSupportChat();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchParams.get("report") === "1") {
      setBody("I need to report an error:\n\n");
    }
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError("Enter a message before sending.");
      return;
    }

    setSubmitting(true);
    try {
      send({
        body: body.trim(),
        page_url: typeof window !== "undefined" ? window.location.pathname : "/chat",
        page_label: "Chat",
        kind: body.toLowerCase().includes("error") ? "error_report" : "message",
      });
      setBody("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-sm text-gray-500">Loading chat…</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Chat"
        description="Contact the app provider to report errors or ask for help. Messages are sent to HMS support."
      />

      <TwoColumnLayout sidebar={<PageSectionNav />}>
      <SurfaceCard className="flex h-[min(640px,calc(100vh-14rem))] flex-col overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
            HMS Support
          </p>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            Signed in as {user?.name ?? "Staff"}
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Report an error or ask a question. Our team will respond here."
            />
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? "rounded-br-md bg-brand-500 text-white"
                        : "rounded-bl-md border border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-200"
                    }`}
                  >
                    {msg.kind === "error_report" && isUser && (
                      <p
                        className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                          isUser ? "text-white/80" : "text-error-500"
                        }`}
                      >
                        Error report
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-theme-sm">{msg.body}</p>
                    {msg.page_label && isUser && (
                      <p
                        className={`mt-2 text-theme-xs ${
                          isUser ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        Page: {msg.page_label}
                      </p>
                    )}
                    <p
                      className={`mt-1.5 text-[10px] ${
                        isUser ? "text-white/60" : "text-gray-400"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={onSubmit}
          className="border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6"
        >
          {error && (
            <div className="mb-3">
              <Alert>{error}</Alert>
            </div>
          )}
          <Field label="Message">
            <textarea
              className={textareaClass}
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe an error or ask the support team a question…"
            />
          </Field>
          <div className="mt-3 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      </SurfaceCard>
      </TwoColumnLayout>
    </PageShell>
  );
}
