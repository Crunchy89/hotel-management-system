import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  action?: React.ReactNode;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  action,
}) => {
  return (
    <div className={`hms-surface overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
            {title}
          </h3>
          {desc && (
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )}
        </div>
        {action}
      </div>

      <div className="px-5 py-4 sm:px-6 sm:py-5">{children}</div>
    </div>
  );
};

export default ComponentCard;
