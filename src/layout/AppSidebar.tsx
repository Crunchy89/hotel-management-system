"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
} from "@/icons";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [{ icon: <GridIcon />, name: "Dashboard", path: "/" }],
  },
  {
    title: "Front Desk",
    items: [
      { icon: <CalenderIcon />, name: "Calendar", path: "/calendar" },
      { icon: <ListIcon />, name: "Reservations", path: "/reservations" },
    ],
  },
  {
    title: "Property",
    items: [{ icon: <BoxCubeIcon />, name: "Rooms", path: "/rooms" }],
  },
  {
    title: "People",
    items: [{ icon: <GroupIcon />, name: "Guests", path: "/guests" }],
  },
  {
    title: "Business",
    items: [{ icon: <PieChartIcon />, name: "Insights", path: "/insights" }],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const isActive = useCallback(
    (path: string) =>
      path === "/" ? pathname === "/" : pathname.startsWith(path),
    [pathname],
  );

  const showLabels = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:mt-0
        ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            H
          </span>
          {showLabels && (
            <span className="text-xl font-semibold text-gray-800 dark:text-white/90">
              HMS Hotel
            </span>
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <h2
                  className={`mb-4 flex text-xs leading-[20px] uppercase text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {showLabels ? section.title : <HorizontaLDots />}
                </h2>
                <ul className="flex flex-col gap-4">
                  {section.items.map((nav) => (
                    <li key={nav.name}>
                      <Link
                        href={nav.path}
                        className={`menu-item group ${
                          isActive(nav.path)
                            ? "menu-item-active"
                            : "menu-item-inactive"
                        } ${
                          !isExpanded && !isHovered
                            ? "lg:justify-center"
                            : "lg:justify-start"
                        }`}
                      >
                        <span
                          className={
                            isActive(nav.path)
                              ? "menu-item-icon-active"
                              : "menu-item-icon-inactive"
                          }
                        >
                          {nav.icon}
                        </span>
                        {showLabels && <span>{nav.name}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
