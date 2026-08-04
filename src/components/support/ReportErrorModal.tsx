"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Alert, Field, textareaClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { routeLabel } from "@/lib/navigation";
import { useSupportChat } from "@/lib/useSupportChat";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type ImageDraft = {
  url: string;
  name: string;
};

export function ReportErrorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { send } = useSupportChat();
  const fileRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<ImageDraft | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pageLabel = routeLabel(pathname);

  useEffect(() => {
    if (!isOpen) {
      setDescription("");
      setImage(null);
      setError("");
      setSent(false);
      setSubmitting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [isOpen]);

  function onPickImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage({
        url: String(reader.result),
        name: file.name,
      });
      setError("");
    };
    reader.onerror = () => setError("Could not read the image file.");
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim() && !image) {
      setError("Add a message and/or attach a screenshot.");
      return;
    }

    setSubmitting(true);
    try {
      send({
        body: description.trim(),
        page_url: pathname,
        page_label: pageLabel,
        kind: "error_report",
        image_url: image?.url,
        image_name: image?.name,
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
          Report
        </h2>
        <p className="mt-1.5 text-theme-sm text-gray-500 dark:text-gray-400">
          Send a screenshot and message to the app provider when something goes
          wrong.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
              Your report was sent with{image ? " the screenshot and" : ""} your
              message. Open HMS Support from the header to track replies.
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

            <Field label="Screenshot">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload image
                </Button>
                {image && (
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-theme-xs text-error-600 hover:underline dark:text-error-400"
                  >
                    Remove
                  </button>
                )}
              </div>
              {image && (
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt="Report attachment preview"
                    className="max-h-48 w-full object-contain bg-gray-100 dark:bg-gray-900"
                  />
                  <p className="border-t border-gray-100 px-3 py-2 text-theme-xs text-gray-500 dark:border-gray-800">
                    {image.name}
                  </p>
                </div>
              )}
            </Field>

            <Field label="Message">
              <textarea
                className={textareaClass}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, what you expected, and steps to reproduce…"
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
