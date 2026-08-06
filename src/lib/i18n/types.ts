export type Locale = "en" | "id";

export type MessageParams = Record<string, string | number>;

/** Flat dictionary of message keys → translated strings. */
export type Dictionary = Record<string, string>;
