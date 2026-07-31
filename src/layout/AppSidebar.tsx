"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

type NavItem = {
  name: string;
  path: string;
};

type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

const topNavItems: NavItem[] = [
  { name: "Dashboard", path: "/" },
  { name: "Insights", path: "/insights" },
];

const navSections: NavSection[] = [
  {
    id: "operational",
    title: "Operational",
    items: [
      { name: "Calendar", path: "/calendar" },
      { name: "Reservations", path: "/reservations" },
      { name: "Housekeeping", path: "/housekeeping" },
      { name: "Guests", path: "/guests" },
      { name: "Rooms", path: "/rooms" },
    ],
  },
  {
    id: "report",
    title: "Report",
    items: [{ name: "Check-In", path: "/check-in" }],
  },
  {
    id: "strategic",
    title: "Strategic",
    items: [
      { name: "Rooms & Prices", path: "/rates" },
      { name: "Channels", path: "/channels" },
      { name: "Yield Rules", path: "/yield-rules" },
    ],
  },
];

function sectionForPath(pathname: string): string {
  for (const section of navSections) {
    if (
      section.items.some((item) =>
        item.path === "/"
          ? pathname === "/"
          : pathname.startsWith(item.path),
      )
    ) {
      return section.id;
    }
  }
  return "operational";
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`shrink-0 text-gray-400 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavBullet({ active }: { active: boolean }) {
  if (active) {
    return (
      <span
        className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-orange-500"
        aria-hidden
      />
    );
  }

  return (
    <span
      className="mt-0.5 h-2 w-2 shrink-0 rounded-full border border-gray-400 dark:border-gray-500"
      aria-hidden
    />
  );
}

function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <Link
      href={item.path}
      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-theme-sm transition ${
        active
          ? "bg-gray-200/70 font-semibold text-gray-900 dark:bg-white/[0.08] dark:text-white"
          : "font-normal text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-gray-200"
      }`}
    >
      <NavBullet active={active} />
      <span className="leading-snug">{item.name}</span>
    </Link>
  );
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = useCallback(
    (path: string) =>
      path === "/" ? pathname === "/" : pathname.startsWith(path),
    [pathname],
  );

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    operational: true,
    report: false,
    strategic: false,
  });

  useEffect(() => {
    const activeSection = sectionForPath(pathname);
    setExpandedSections((prev) => ({ ...prev, [activeSection]: true }));
  }, [pathname]);

  function toggleSection(id: string) {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-gray-50 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:mt-0
        ${isExpanded || isMobileOpen || isHovered ? "w-[260px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex border-b border-gray-200/80 px-5 py-6 dark:border-gray-800 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            H
          </span>
          {showLabels && (
            <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
              HMS Hotel
            </span>
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-4 pb-8 pt-4 duration-300 ease-linear">
        <nav className="flex flex-col gap-2">
          {showLabels && (
            <ul className="mb-2 flex flex-col gap-0.5 border-b border-gray-200 pb-3 dark:border-gray-800">
              {topNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink item={item} active={isActive(item.path)} />
                </li>
              ))}
            </ul>
          )}

          {!showLabels && (
            <ul className="mb-2 flex flex-col items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
              {topNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    title={item.name}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isActive(item.path)
                        ? "bg-gray-200 dark:bg-white/[0.08]"
                        : "hover:bg-gray-100 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <NavBullet active={isActive(item.path)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {navSections.map((section) => {
            const isOpen = expandedSections[section.id] ?? false;

            return (
              <div key={section.id} className="rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-100 dark:hover:bg-white/[0.04] ${
                    !showLabels ? "lg:justify-center" : ""
                  }`}
                  aria-expanded={isOpen}
                >
                  {showLabels ? (
                    <>
                      <span className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                        {section.title}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  )}
                </button>

                {showLabels && isOpen && (
                  <ul className="mt-1 flex flex-col gap-0.5 pb-2 pl-1">
                    {section.items.map((item) => {
                      const active = isActive(item.path);

                      return (
                        <li key={item.path}>
                          <NavLink item={item} active={active} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
