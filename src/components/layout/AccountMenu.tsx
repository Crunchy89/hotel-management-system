"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupportChatPanel } from "@/context/SupportChatContext";
import { useModal } from "@/hooks/useModal";
import { ReportErrorModal } from "@/components/support/ReportErrorModal";

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { open: openSupportChat } = useSupportChatPanel();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const reportModal = useModal();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!user) return null;

  function handleLogout() {
    setOpen(false);
    logout();
    router.push("/login");
  }

  function handleReport() {
    setOpen(false);
    reportModal.openModal();
  }

  function handleSupportChat() {
    setOpen(false);
    openSupportChat();
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-gray-50 dark:hover:bg-white/[0.04]"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className="hidden text-right md:block">
            <span className="block text-theme-sm font-medium text-gray-700 dark:text-gray-200">
              {user.name}
            </span>
            <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
              {user.role}
            </span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-theme-xs font-semibold text-brand-600 ring-2 ring-white dark:bg-brand-500/15 dark:text-brand-400 dark:ring-gray-900">
            {user.initials}
          </span>
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800 md:hidden">
              <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                {user.name}
              </p>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={handleReport}
              className="menu-dropdown-item menu-dropdown-item-inactive w-full text-left"
            >
              Report
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleSupportChat}
              className="menu-dropdown-item menu-dropdown-item-inactive w-full text-left"
            >
              Chat
            </button>

            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="menu-dropdown-item menu-dropdown-item-inactive w-full text-left text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <ReportErrorModal
        isOpen={reportModal.isOpen}
        onClose={reportModal.closeModal}
      />
    </>
  );
}
