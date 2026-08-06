"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/context/LocaleContext";
import {
  isActivePath,
  NAV_SECTIONS,
  sectionForPath,
  type NavItem,
} from "@/lib/navigation";
import { SidePanel } from "@/components/ui/layout";

function SectionNavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const t = useT();
  const label = t(item.labelKey);
  const className = `block w-full rounded-lg px-3 py-2.5 text-left text-theme-sm transition ${
    active
      ? "font-semibold text-brand-600 dark:text-brand-400"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-gray-200"
  }`;

  if (item.path.startsWith("#")) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          document
            .querySelector(item.path)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <Link href={item.path} className={className}>
      {label}
    </Link>
  );
}

export function PageSectionNav({ items }: { items?: NavItem[] }) {
  const pathname = usePathname();
  const t = useT();
  const sectionId = sectionForPath(pathname);
  const section = NAV_SECTIONS.find((s) => s.id === sectionId);
  const navItems = items ?? section?.items ?? [];

  if (!section || navItems.length === 0) return null;

  return (
    <SidePanel title={t(section.titleKey)}>
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={`${item.path}-${item.labelKey}`}>
            <SectionNavLink
              item={item}
              active={
                item.path.startsWith("#")
                  ? false
                  : isActivePath(pathname, item.path)
              }
            />
          </li>
        ))}
      </ul>
    </SidePanel>
  );
}
