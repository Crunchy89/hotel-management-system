"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  getDictionary,
  translate,
  type Locale,
  type MessageParams,
} from "@/lib/i18n";

type TranslateFn = (key: string, params?: MessageParams) => string;

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslateFn;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const STORAGE_KEY = "hms-locale";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readLocale(): Locale {
  return window.localStorage.getItem(STORAGE_KEY) === "id" ? "id" : "en";
}

function getSnapshot(): Locale {
  return readLocale();
}

function getServerSnapshot(): Locale {
  return "en";
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((listener) => listener());
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(readLocale() === "id" ? "en" : "id");
  }, [setLocale]);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(getDictionary(locale), key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
};

export const useT = () => useLocale().t;
