"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/rooms", label: "Rooms" },
  { href: "/guests", label: "Guests" },
  { href: "/reservations", label: "Reservations" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-screen bg-bg text-ink">
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-[#132033] text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-xs font-semibold tracking-[0.18em] text-emerald-300/90 uppercase">
            HMS
          </div>
          <div className="mt-1 text-lg font-semibold tracking-tight">Hotel Desk</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.replace(/\/$/, ""));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/50">
          Hotel property management
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col overflow-auto">
        <div className="mx-auto w-full max-w-6xl flex-1 p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
