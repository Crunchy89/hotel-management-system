import { formatDate } from "@/lib/metrics";
import type { RoomTypeRecord, YieldRule, YieldRuleType } from "@/lib/types";

export const RULE_TYPE_OPTIONS: { value: YieldRuleType; label: string }[] = [
  { value: "min_stay", label: "Minimum stay" },
  { value: "max_stay", label: "Maximum stay" },
  { value: "stop_sell", label: "Stop sell" },
  { value: "closed_to_arrival", label: "Closed to arrival" },
  { value: "closed_to_departure", label: "Closed to departure" },
  { value: "rate_adjustment", label: "Rate adjustment" },
];

export function ruleTypeLabel(type: YieldRuleType): string {
  return RULE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function ruleValueLabel(rule: YieldRule): string {
  switch (rule.rule_type) {
    case "min_stay":
    case "max_stay":
      return `${rule.value} night${rule.value === 1 ? "" : "s"}`;
    case "rate_adjustment":
      return `${rule.value > 0 ? "+" : ""}${rule.value}%`;
    case "stop_sell":
    case "closed_to_arrival":
    case "closed_to_departure":
      return rule.status === "active" ? "Applied" : "Off";
    default:
      return String(rule.value);
  }
}

export function roomTypeLabel(
  slug: string,
  roomTypes: RoomTypeRecord[],
): string {
  if (slug === "all") return "All room types";
  return roomTypes.find((t) => t.slug === slug)?.label ?? slug;
}

export function formatRuleDates(from: string, to: string): string {
  return `${formatDate(from, { day: "numeric", month: "short" })} – ${formatDate(to, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function filterYieldRules(
  rules: YieldRule[],
  typeFilter: string,
  roomTypeFilter: string,
  statusFilter: string,
  query: string,
): YieldRule[] {
  const q = query.trim().toLowerCase();
  return rules.filter((rule) => {
    if (typeFilter !== "all" && rule.rule_type !== typeFilter) return false;
    if (roomTypeFilter !== "all" && rule.room_type_slug !== roomTypeFilter) {
      return false;
    }
    if (statusFilter !== "all" && rule.status !== statusFilter) return false;
    if (!q) return true;
    return rule.name.toLowerCase().includes(q);
  });
}

export function summarizeYieldRules(rules: YieldRule[]) {
  return {
    total: rules.length,
    active: rules.filter((r) => r.status === "active").length,
    restrictions: rules.filter((r) =>
      ["stop_sell", "closed_to_arrival", "closed_to_departure"].includes(
        r.rule_type,
      ),
    ).length,
    pricing: rules.filter((r) => r.rule_type === "rate_adjustment").length,
  };
}
