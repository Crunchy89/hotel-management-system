"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { useSidebar } from "@/context/SidebarContext";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Public booking engine — no staff chrome
  if (pathname.startsWith("/book")) {
    return <>{children}</>;
  }

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[260px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen w-full bg-gray-50 xl:flex dark:bg-gray-900">
      <AppSidebar />
      <Backdrop />
      <div
        className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        <div className="w-full p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
