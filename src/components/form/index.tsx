import React from "react";

export const inputClass =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-theme-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 transition focus:border-brand-300 focus:outline-hidden focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

export const selectClass = inputClass;

export const textareaClass =
  "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

export const Label: React.FC<{
  htmlFor?: string;
  children: React.ReactNode;
}> = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
  >
    {children}
  </label>
);

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = "" }) => (
  <div className={className}>
    <Label>{label}</Label>
    {children}
  </div>
);

export const Alert: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="mb-5 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400">
    {children}
  </div>
);
