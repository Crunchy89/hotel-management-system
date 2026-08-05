import QRCode from "qrcode";

/** Renders any payload as a PNG data URL that components can drop into an <img>. */
export async function qrDataUrl(
  payload: string,
  size = 220,
): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#101828", light: "#ffffff" },
  });
}

export type KeyCardQrPayload = {
  ref: string;
  room: string;
  in: string;
  out: string;
  key: string;
};

export function parseKeyCardPayload(payload: string): KeyCardQrPayload | null {
  try {
    return JSON.parse(payload) as KeyCardQrPayload;
  } catch {
    return null;
  }
}
