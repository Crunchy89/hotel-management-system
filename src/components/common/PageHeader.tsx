import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
}) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
    {action && <div className="flex flex-wrap gap-2">{action}</div>}
  </header>
);

export default PageHeader;
