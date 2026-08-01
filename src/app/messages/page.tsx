"use client";

import React, { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Alert, Field, inputClass, selectClass, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import {
  EmptyState,
  PageShell,
  SurfaceCard,
  SurfaceCardHeader,
  tableBodyCell,
  tableHeaderCell,
} from "@/components/ui/layout";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/metrics";
import {
  messageKindLabel,
  messageTemplateKinds,
  renderMessageTemplate,
} from "@/lib/messaging";
import type { MessageKind } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

export default function MessagesPage() {
  const {
    reservations,
    guests,
    guest_messages,
    loading,
    error,
    mutate,
  } = useHotelData();

  const activeReservations = useMemo(
    () =>
      reservations.filter(
        (r) => r.status === "booked" || r.status === "checked_in" || r.status === "checked_out",
      ),
    [reservations],
  );

  const [reservationId, setReservationId] = useState("");
  const [kind, setKind] = useState<Exclude<MessageKind, "custom">>("confirmation");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const selected = activeReservations.find((r) => r.id === reservationId);
  const guest = selected
    ? guests.find((g) => g.id === selected.guest_id)
    : undefined;

  function loadTemplate(nextKind: Exclude<MessageKind, "custom">, resId: string) {
    const reservation = reservations.find((r) => r.id === resId);
    if (!reservation) return;
    const g = guests.find((x) => x.id === reservation.guest_id);
    const rendered = renderMessageTemplate(nextKind, reservation, g);
    setSubject(rendered.subject);
    setBody(rendered.body);
  }

  async function send() {
    if (!reservationId) return;
    const ok = await mutate(() =>
      api.sendGuestMessage({
        reservation_id: reservationId,
        kind,
        subject,
        body,
      }),
    );
    if (ok) {
      // keep form for resend / tweak
    }
  }

  if (loading) {
    return (
      <PageShell>
        <p className="text-sm text-gray-500">Loading messages…</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Guest messages"
        description="Send confirmation, pre-arrival, and thank-you emails (stored locally — no real mail server)."
      />

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SurfaceCard>
          <SurfaceCardHeader title="Compose" description="Pick a stay and template" />
          <div className="space-y-4 p-5 sm:p-6">
            <Field label="Reservation">
              <select
                className={selectClass}
                value={reservationId}
                onChange={(e) => {
                  const id = e.target.value;
                  setReservationId(id);
                  if (id) loadTemplate(kind, id);
                }}
              >
                <option value="">Select reservation…</option>
                {activeReservations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.guest_name} · {r.reference || r.id.slice(0, 8)} ·{" "}
                    {formatDate(r.check_in)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Template">
              <select
                className={selectClass}
                value={kind}
                onChange={(e) => {
                  const next = e.target.value as Exclude<MessageKind, "custom">;
                  setKind(next);
                  if (reservationId) loadTemplate(next, reservationId);
                }}
              >
                {messageTemplateKinds().map((k) => (
                  <option key={k} value={k}>
                    {messageKindLabel(k)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject">
              <input
                className={inputClass}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!reservationId}
              />
            </Field>
            <Field label="Body">
              <textarea
                className={`${textareaClass} min-h-[180px]`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={!reservationId}
              />
            </Field>
            {guest && (
              <p className="text-xs text-gray-500">
                To: {guest.email || "no email on file"} · {guest.phone || "no phone"}
              </p>
            )}
            <Button
              disabled={!reservationId || !subject || !body}
              onClick={() => void send()}
            >
              Send message
            </Button>
          </div>
        </SurfaceCard>

        <SurfaceCard padding={false}>
          <SurfaceCardHeader
            title="Sent log"
            description={`${guest_messages.length} message${guest_messages.length === 1 ? "" : "s"}`}
          />
          {guest_messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Confirm a booking or send a template from the compose panel."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className={tableHeaderCell}>Sent</th>
                    <th className={tableHeaderCell}>Guest</th>
                    <th className={tableHeaderCell}>Kind</th>
                    <th className={tableHeaderCell}>Subject</th>
                  </tr>
                </thead>
                <tbody>
                  {guest_messages.map((m) => {
                    const res = reservations.find((r) => r.id === m.reservation_id);
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-gray-50 dark:border-gray-800/80"
                      >
                        <td className={tableBodyCell}>
                          {m.sent_at
                            ? formatDate(m.sent_at.slice(0, 10), {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className={tableBodyCell}>
                          {res?.guest_name ?? m.guest_id.slice(0, 8)}
                        </td>
                        <td className={tableBodyCell}>
                          {messageKindLabel(m.kind)}
                        </td>
                        <td className={tableBodyCell}>{m.subject}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
