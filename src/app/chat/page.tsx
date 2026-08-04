"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Alert, Field, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { EmptyState, PageShell, SurfaceCard } from "@/components/ui/layout";
import { useClientChat } from "@/lib/useClientChat";
import { useHotelData } from "@/lib/useHotelData";

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

export default function ClientChatPage() {
  const { reservations, guests, loading: dataLoading } = useHotelData();
  const { messages, threads, loading, seed, send, messagesForReservation } =
    useClientChat(reservations, guests);

  const activeReservations = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.status === "booked" ||
          r.status === "checked_in" ||
          r.status === "checked_out",
      ),
    [reservations],
  );

  const [selectedId, setSelectedId] = useState<string>("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dataLoading && reservations.length > 0) {
      seed();
    }
  }, [dataLoading, reservations.length, seed]);

  useEffect(() => {
    if (!selectedId && threads.length > 0) {
      setSelectedId(threads[0]!.reservation_id);
    }
  }, [threads, selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  const selectedReservation =
    activeReservations.find((r) => r.id === selectedId) ??
    reservations.find((r) => r.id === selectedId);

  const threadMessages = selectedId
    ? messagesForReservation(selectedId)
    : [];

  const guestName =
    selectedReservation?.guest_name ??
    threads.find((t) => t.reservation_id === selectedId)?.guest_name ??
    "Guest";

  function startNewChat(reservationId: string) {
    setSelectedId(reservationId);
    setBody("");
    setError("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedReservation) {
      setError("Select a guest conversation first.");
      return;
    }
    if (!body.trim()) {
      setError("Enter a message before sending.");
      return;
    }

    setSubmitting(true);
    try {
      send({
        reservation_id: selectedReservation.id,
        guest_id: selectedReservation.guest_id,
        guest_name: guestName,
        body: body.trim(),
        sender: "staff",
      });
      setBody("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSubmitting(false);
    }
  }

  if (dataLoading || loading) {
    return (
      <PageShell>
        <p className="text-sm text-gray-500">Loading client chat…</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Client chat"
        description="Live messaging with guests about their stay — questions, requests, and updates."
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <SurfaceCard className="flex max-h-[min(720px,calc(100vh-12rem))] flex-col overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Conversations
            </p>
            <p className="text-theme-xs text-gray-500">
              {threads.length} active thread{threads.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {threads.length === 0 ? (
              <p className="px-2 py-4 text-theme-sm text-gray-500">
                No conversations yet. Start one from an active reservation
                below.
              </p>
            ) : (
              <ul className="space-y-1">
                {threads.map((thread) => {
                  const active = thread.reservation_id === selectedId;
                  return (
                    <li key={thread.reservation_id}>
                      <button
                        type="button"
                        onClick={() => startNewChat(thread.reservation_id)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                          active
                            ? "bg-brand-50 dark:bg-brand-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {thread.guest_name}
                          </p>
                          {thread.unread_from_guest > 0 && (
                            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              {thread.unread_from_guest}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-theme-xs text-gray-500">
                          {thread.last_message}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-gray-100 p-3 dark:border-gray-800">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              New conversation
            </p>
            <select
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-theme-sm dark:border-gray-700 dark:bg-gray-900"
              value=""
              onChange={(e) => {
                if (e.target.value) startNewChat(e.target.value);
              }}
            >
              <option value="">Select guest / reservation…</option>
              {activeReservations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.guest_name} · {r.reference ?? r.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </SurfaceCard>

        <SurfaceCard className="flex max-h-[min(720px,calc(100vh-12rem))] flex-col overflow-hidden">
          {!selectedId ? (
            <EmptyState
              title="Select a conversation"
              description="Choose a guest thread or start a new chat from an active reservation."
            />
          ) : (
            <>
              <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                  {guestName}
                </p>
                <p className="text-theme-xs text-gray-500">
                  {selectedReservation?.reference ??
                    selectedReservation?.id.slice(0, 8)}{" "}
                  · Check-in {selectedReservation?.check_in}
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {threadMessages.length === 0 ? (
                  <p className="text-theme-sm text-gray-500">
                    No messages in this thread yet. Send the first message
                    below.
                  </p>
                ) : (
                  threadMessages.map((msg) => {
                    const isStaff = msg.sender === "staff";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isStaff ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            isStaff
                              ? "rounded-br-md bg-brand-500 text-white"
                              : "rounded-bl-md border border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-200"
                          }`}
                        >
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                            {isStaff ? "You" : msg.guest_name}
                          </p>
                          <p className="whitespace-pre-wrap text-theme-sm">
                            {msg.body}
                          </p>
                          <p
                            className={`mt-1.5 text-[10px] ${
                              isStaff ? "text-white/60" : "text-gray-400"
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
                className="border-t border-gray-100 px-5 py-4 dark:border-gray-800"
              >
                {error && (
                  <div className="mb-3">
                    <Alert>{error}</Alert>
                  </div>
                )}
                <Field label="Reply to guest">
                  <textarea
                    className={textareaClass}
                    rows={3}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type your message to the guest…"
                  />
                </Field>
                <div className="mt-3 flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Sending…" : "Send to guest"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
