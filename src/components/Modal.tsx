"use client";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-line bg-surface shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-muted hover:bg-bg hover:text-ink"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand";

export const btnPrimary =
  "rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-[#0c5c48] disabled:opacity-50";

export const btnSecondary =
  "rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-bg disabled:opacity-50";

export const btnDanger =
  "rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-rose-100 disabled:opacity-50";

export const btnSmall =
  "rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-bg disabled:opacity-50";
