import type { Guest, GuestMessage, MessageKind, Reservation } from "@/lib/types";
import { formatDate } from "@/lib/metrics";

const TEMPLATES: Record<
  Exclude<MessageKind, "custom">,
  { subject: string; body: string }
> = {
  confirmation: {
    subject: "Booking confirmation — {{reference}}",
    body: `Dear {{guest_name}},

Thank you for booking with HMS Hotel.

Reference: {{reference}}
Check-in: {{check_in}}
Check-out: {{check_out}}
Room: {{room}}

We look forward to welcoming you.

HMS Hotel`,
  },
  pre_arrival: {
    subject: "Getting ready for your stay — {{reference}}",
    body: `Dear {{guest_name}},

Your stay is coming up soon.

Check-in: {{check_in}} (from 14:00)
Check-out: {{check_out}} (by 11:00)
Room: {{room}}
Reference: {{reference}}

Reply to this message if you have any special requests.

HMS Hotel`,
  },
  thank_you: {
    subject: "Thank you for staying with us",
    body: `Dear {{guest_name}},

Thank you for choosing HMS Hotel. We hope you enjoyed your stay ({{check_in}} – {{check_out}}).

We would love to welcome you back again.

HMS Hotel`,
  },
};

export function messageTemplateKinds(): Exclude<MessageKind, "custom">[] {
  return ["confirmation", "pre_arrival", "thank_you"];
}

export function renderMessageTemplate(
  kind: Exclude<MessageKind, "custom">,
  reservation: Reservation,
  guest: Guest | undefined,
): { subject: string; body: string } {
  const tpl = TEMPLATES[kind];
  const vars: Record<string, string> = {
    guest_name:
      reservation.guest_name ??
      (guest ? `${guest.first_name} ${guest.last_name}` : "Guest"),
    reference: reservation.reference || reservation.id.slice(0, 8).toUpperCase(),
    check_in: formatDate(reservation.check_in, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    check_out: formatDate(reservation.check_out, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    room: reservation.room_number
      ? `Room ${reservation.room_number}`
      : reservation.room_type
        ? reservation.room_type
        : "TBA",
  };

  const apply = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");

  return { subject: apply(tpl.subject), body: apply(tpl.body) };
}

export function messageKindLabel(kind: MessageKind): string {
  switch (kind) {
    case "confirmation":
      return "Confirmation";
    case "pre_arrival":
      return "Pre-arrival";
    case "thank_you":
      return "Thank you";
    default:
      return "Custom";
  }
}

export function sortMessages(messages: GuestMessage[]): GuestMessage[] {
  return [...messages].sort((a, b) =>
    (b.sent_at ?? b.created_at).localeCompare(a.sent_at ?? a.created_at),
  );
}
