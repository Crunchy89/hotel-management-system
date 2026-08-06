"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocaleToggleButton } from "@/components/common/LocaleToggleButton";
import { Alert, Field, inputClass } from "@/components/form";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useT } from "@/context/LocaleContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("reception@hmshotel.com");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500 dark:bg-gray-900">
        {t("login.signingIn")}
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(email, password);
    if (ok) {
      router.replace("/");
    } else {
      setError(t("login.error"));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            H
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white/90">
              {t("login.title")}
            </h1>
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              {t("login.subtitle")}
            </p>
          </div>
          <LocaleToggleButton />
        </div>

        {error && <Alert>{error}</Alert>}

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t("common.email")}>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label={t("common.password")}>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          <Button type="submit" className="w-full">
            {t("login.submit")}
          </Button>
        </form>

        <p className="mt-6 text-center text-theme-xs text-gray-500 dark:text-gray-400">
          Demo: reception@hmshotel.com / demo
        </p>
      </div>
    </div>
  );
}
