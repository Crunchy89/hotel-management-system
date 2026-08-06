"use client";

import React from "react";
import { useLocale } from "@/context/LocaleContext";

export const LocaleToggleButton: React.FC = () => {
  const { locale, toggleLocale, t } = useLocale();
  const next = locale === "en" ? "ID" : "EN";

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={locale === "en" ? t("locale.switchToId") : t("locale.switchToEn")}
      title={locale === "en" ? t("locale.switchToId") : t("locale.switchToEn")}
      className="flex h-11 min-w-11 items-center justify-center rounded-full border border-gray-200 bg-white px-2.5 text-theme-xs font-semibold tracking-wide text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {next}
    </button>
  );
};
