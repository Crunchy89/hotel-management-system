"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Alert } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { useT } from "@/context/LocaleContext";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/metrics";
import { qrDataUrl } from "@/lib/qr";
import type { KeyCard, Reservation, Room } from "@/lib/types";
import { useHotelData } from "@/lib/useHotelData";

/** Time the mock encoder spends "writing" the card. */
const ENCODE_MS = 1400;

export const KEY_CARD_STATUS_TONE: Record<KeyCard["status"], string> = {
  not_written: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  active:
    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  revoked:
    "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
};

/** @deprecated Prefer translating via t(`keycard.*`) in UI. Kept for tone lookup. */
export const KEY_CARD_STATUS_COPY: Record<
  KeyCard["status"],
  { label: string; tone: string }
> = {
  not_written: {
    label: "Not written",
    tone: KEY_CARD_STATUS_TONE.not_written,
  },
  active: {
    label: "Active",
    tone: KEY_CARD_STATUS_TONE.active,
  },
  revoked: {
    label: "Revoked",
    tone: KEY_CARD_STATUS_TONE.revoked,
  },
};

export function keyCardFor(
  cards: KeyCard[],
  reservationId?: string,
): KeyCard | null {
  if (!reservationId) return null;
  return cards.find((c) => c.reservation_id === reservationId) ?? null;
}

interface KeyCardPanelProps {
  reservation: Reservation;
  room?: Room;
  /** Renders the encoder buttons inside the panel instead of a dialog footer. */
  showActions?: boolean;
}

export function useKeyCardEncoder(reservation: Reservation) {
  const t = useT();
  const { key_cards, mutate } = useHotelData();
  const [encoding, setEncoding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const card = keyCardFor(key_cards, reservation.id);
  const status = card?.status ?? "not_written";

  async function encode() {
    setError("");
    setEncoding(true);
    await new Promise((resolve) => setTimeout(resolve, ENCODE_MS));
    const ok = await mutate(() =>
      api.writeKeyCard({ reservation_id: reservation.id }),
    );
    setEncoding(false);
    if (!ok) setError(t("keycard.encodeError"));
  }

  async function revoke() {
    if (!card) return;
    setBusy(true);
    setError("");
    const ok = await mutate(() => api.revokeKeyCard(card.id));
    setBusy(false);
    if (!ok) setError(t("keycard.revokeError"));
  }

  const writeLabel =
    status === "active"
      ? t("keycard.rewrite")
      : status === "revoked"
        ? t("keycard.writeNew")
        : t("keycard.write");

  // Keys are handed over at the desk, so the guest must be checked in first.
  const checkedIn = reservation.status === "checked_in";

  return {
    card,
    status,
    encoding,
    busy,
    error,
    encode,
    revoke,
    writeLabel,
    checkedIn,
    canEncode: !encoding && !busy && checkedIn && Boolean(reservation.room_id),
  };
}

type EncoderState = ReturnType<typeof useKeyCardEncoder>;

export function KeyCardBody({
  reservation,
  room,
  encoder,
}: {
  reservation: Reservation;
  room?: Room;
  encoder: EncoderState;
}) {
  const t = useT();
  const { card, status, encoding, error } = encoder;
  const payload = status === "active" && card ? card.qr_payload : "";
  const [qr, setQr] = useState<{ payload: string; url: string } | null>(null);

  useEffect(() => {
    if (!payload) return;
    let cancelled = false;
    void qrDataUrl(payload).then((url) => {
      if (!cancelled) setQr({ payload, url });
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  // Never show a code rendered for an older key.
  const qrUrl = qr?.payload === payload ? qr.url : "";

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      {!reservation.room_id ? (
        <p className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-theme-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
          {t("keycard.needRoom")}
        </p>
      ) : (
        !encoder.checkedIn && (
          <p className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-theme-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
            {t("keycard.needCheckIn")}
          </p>
        )
      )}

      {encoding ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            {t("keycard.insertCard")}
          </p>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">
            {t("keycard.holdCard")}
          </p>
        </div>
      ) : status === "active" && card ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {t("keycard.keyCode")}
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-widest text-gray-900 dark:text-white/90">
              {card.code}
            </p>
            <dl className="mt-3 space-y-1 text-theme-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between gap-3">
                <dt>{t("keycard.room")}</dt>
                <dd>
                  {room
                    ? t("keycard.roomLabel", { number: room.number })
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t("keycard.valid")}</dt>
                <dd>
                  {formatDate(reservation.check_in)} →{" "}
                  {formatDate(reservation.check_out)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>{t("keycard.writes")}</dt>
                <dd>{card.write_count}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {t("keycard.selfCheckInQr")}
            </p>
            {qrUrl ? (
              <Image
                src={qrUrl}
                alt={t("keycard.qrAlt")}
                width={200}
                height={200}
                unoptimized
                className="rounded-lg bg-white p-2"
              />
            ) : (
              <div className="h-[200px] w-[200px] animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            )}
            <p className="text-center text-theme-xs text-gray-500 dark:text-gray-400">
              {t("keycard.qrHint")}
            </p>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-theme-sm text-gray-600 dark:text-gray-300">
            {status === "revoked"
              ? t("keycard.revokedHint")
              : t("keycard.notWrittenHint")}
          </p>
        </div>
      )}
    </div>
  );
}

/** Self-contained key card section for use inside another dialog's tab. */
export default function KeyCardPanel({
  reservation,
  room,
  showActions = true,
}: KeyCardPanelProps) {
  const t = useT();
  const encoder = useKeyCardEncoder(reservation);
  const statusLabel =
    encoder.status === "active"
      ? t("keycard.active")
      : encoder.status === "revoked"
        ? t("keycard.revoked")
        : t("keycard.notWritten");

  return (
    <section className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h6 className="text-xs font-semibold uppercase text-gray-500">
          {t("keycard.doorKey")}
        </h6>
        <span
          className={`rounded-full px-2.5 py-1 text-theme-xs font-medium ${KEY_CARD_STATUS_TONE[encoder.status]}`}
        >
          {statusLabel}
        </span>
      </div>

      <KeyCardBody reservation={reservation} room={room} encoder={encoder} />

      {showActions && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            disabled={!encoder.canEncode}
            onClick={() => void encoder.encode()}
          >
            {encoder.writeLabel}
          </Button>
          {encoder.status === "active" && (
            <button
              type="button"
              disabled={encoder.busy}
              onClick={() => void encoder.revoke()}
              className="text-sm font-medium text-error-600 hover:text-error-700 disabled:opacity-50 dark:text-error-400"
            >
              {t("keycard.revoke")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
