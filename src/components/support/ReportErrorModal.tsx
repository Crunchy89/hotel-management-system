"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Alert, Field, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { routeLabel } from "@/lib/navigation";
import { useSupportChat } from "@/lib/useSupportChat";

export function ReportErrorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { send } = useSupportChat();
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pageLabel = routeLabel(pathname);

  useEffect(() => {
    if (!isOpen) {
      setDescription("");
      setError("");
      setSent(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe the error or issue.");
      return;
    }

    setSubmitting(true);
    try {
      send({
        body: description.trim(),
        page_url: pathname,
        page_label: pageLabel,
        kind: "error_report",
      });
      setSent(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
          Report an error
        </h2>
        <p className="mt-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
          Send a report to the app provider. Include what you were doing when the
          error occurred.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
              Your report was sent. You can track replies in Chat.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && <Alert>{error}</Alert>}

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Current page
              </p>
              <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                {pageLabel}
              </p>
              <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                {pathname}
              </p>
            </div>

            <Field label="What went wrong? *">
              <textarea
                className={textareaClass}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the error, unexpected behaviour, or steps to reproduce…"
                required
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send report"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
