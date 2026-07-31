import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  badge,
}) => (
  <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white/90 sm:text-2xl">
          {title}
        </h1>
        {badge}
      </div>
      {description && (
        <p className="mt-1.5 max-w-2xl text-theme-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
    {action && (
      <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
    )}
  </header>
);

export default PageHeader;
