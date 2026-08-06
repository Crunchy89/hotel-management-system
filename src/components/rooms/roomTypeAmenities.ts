import type { BedSize, RoomTypeAmenities, RoomTypeRecord } from "@/lib/types";

type TranslateFn = (key: string) => string;

export const BED_SIZE_OPTIONS: {
  value: BedSize;
  labelKey: string;
  label: string;
}[] = [
  { value: "single", labelKey: "bed.single", label: "Single" },
  { value: "twin", labelKey: "bed.twin", label: "Twin" },
  { value: "double", labelKey: "bed.double", label: "Double" },
  { value: "queen", labelKey: "bed.queen", label: "Queen" },
  { value: "king", labelKey: "bed.king", label: "King" },
];

export const AMENITY_OPTIONS: {
  key: keyof RoomTypeAmenities;
  labelKey: string;
  label: string;
}[] = [
  { key: "ac", labelKey: "amenity.ac", label: "AC" },
  { key: "tv", labelKey: "amenity.tv", label: "TV" },
  { key: "wifi", labelKey: "amenity.wifi", label: "Wi‑Fi" },
  { key: "minibar", labelKey: "amenity.minibar", label: "Minibar" },
  { key: "bathtub", labelKey: "amenity.bathtub", label: "Bathtub" },
  { key: "safe", labelKey: "amenity.safe", label: "Safe" },
  { key: "hairdryer", labelKey: "amenity.hairdryer", label: "Hairdryer" },
  { key: "desk", labelKey: "amenity.desk", label: "Desk" },
];

export const DEFAULT_AMENITIES: RoomTypeAmenities = {
  ac: true,
  tv: true,
  wifi: true,
  minibar: false,
  bathtub: false,
  safe: false,
  hairdryer: false,
  desk: false,
};

export function bedSizeLabel(size: BedSize, t?: TranslateFn): string {
  const opt = BED_SIZE_OPTIONS.find((o) => o.value === size);
  if (!opt) return size;
  return t ? t(opt.labelKey) : opt.label;
}

export function amenitySummary(
  type: RoomTypeRecord,
  t?: TranslateFn,
): string {
  const enabled = AMENITY_OPTIONS.filter((o) => type.amenities[o.key]).map(
    (o) => (t ? t(o.labelKey) : o.label),
  );
  const bed = bedSizeLabel(type.bed_size, t);
  if (enabled.length === 0) return bed;
  return `${bed} · ${enabled.join(", ")}`;
}

export function amenitySummaryLocalized(
  type: RoomTypeRecord,
  t: TranslateFn,
): string {
  return amenitySummary(type, t);
}
