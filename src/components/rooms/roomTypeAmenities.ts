import type { BedSize, RoomTypeAmenities, RoomTypeRecord } from "@/lib/types";

export const BED_SIZE_OPTIONS: { value: BedSize; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "twin", label: "Twin" },
  { value: "double", label: "Double" },
  { value: "queen", label: "Queen" },
  { value: "king", label: "King" },
];

export const AMENITY_OPTIONS: {
  key: keyof RoomTypeAmenities;
  label: string;
}[] = [
  { key: "ac", label: "AC" },
  { key: "tv", label: "TV" },
  { key: "wifi", label: "Wi‑Fi" },
  { key: "minibar", label: "Minibar" },
  { key: "bathtub", label: "Bathtub" },
  { key: "safe", label: "Safe" },
  { key: "hairdryer", label: "Hairdryer" },
  { key: "desk", label: "Desk" },
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

export function bedSizeLabel(size: BedSize): string {
  return BED_SIZE_OPTIONS.find((o) => o.value === size)?.label ?? size;
}

export function amenitySummary(type: RoomTypeRecord): string {
  const enabled = AMENITY_OPTIONS.filter((o) => type.amenities[o.key]).map(
    (o) => o.label,
  );
  const bed = bedSizeLabel(type.bed_size);
  if (enabled.length === 0) return bed;
  return `${bed} · ${enabled.join(", ")}`;
}
