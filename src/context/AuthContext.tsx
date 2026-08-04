"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type AuthUser = {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
};

const STORAGE_KEY = "hms-auth-session";

const DEMO_USER: AuthUser = {
  id: "user-reception",
  name: "Reception",
  role: "Front desk",
  email: "reception@hmshotel.com",
  initials: "RC",
};

type Session = { user: AuthUser } | null;

let session: Session = null;
const listeners = new Set<() => void>();

function readSession(): Session {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return parsed?.user ? parsed : null;
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function getSnapshot(): Session {
  if (typeof window === "undefined") return null;
  return session;
}

function getServerSnapshot(): Session {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function persist(next: Session) {
  session = next;
  if (typeof window !== "undefined") {
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  emit();
}

if (typeof window !== "undefined") {
  session = readSession();
}

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = useCallback((email: string, password: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !password.trim()) return false;
    const user: AuthUser = {
      ...DEMO_USER,
      email: trimmed,
      name: trimmed.split("@")[0]?.replace(/\./g, " ") || DEMO_USER.name,
      initials: (trimmed.slice(0, 2) || "RC").toUpperCase(),
    };
    persist({ user });
    return true;
  }, []);

  const logout = useCallback(() => {
    persist(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: current?.user ?? null,
      isAuthenticated: Boolean(current?.user),
      login,
      logout,
    }),
    [current, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
