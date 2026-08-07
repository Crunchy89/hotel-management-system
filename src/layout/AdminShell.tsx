"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { SupportChatProvider } from "@/context/SupportChatContext";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const isLoginPage = pathname.startsWith("/login");
  const isMobileGuestPage = pathname.startsWith("/m/");

  useEffect(() => {
    if (!isAuthenticated && !isLoginPage && !isMobileGuestPage) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoginPage, isMobileGuestPage, router]);

  if (isLoginPage || isMobileGuestPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500 dark:bg-gray-900">
        Redirecting to sign in…
      </div>
    );
  }

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[260px]"
      : "lg:ml-[90px]";

  return (
    <SupportChatProvider>
      <div className="min-h-screen w-full bg-gray-50 xl:flex dark:bg-gray-900">
        <AppSidebar />
        <Backdrop />
        <div
          className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          <div className="w-full p-4 md:p-6">{children}</div>
        </div>
        <SupportChatWidget />
      </div>
    </SupportChatProvider>
  );
}
