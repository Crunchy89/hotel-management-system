import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  size?: "xs" | "sm" | "md";
  variant?: "primary" | "outline" | "ghost" | "danger";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => {
  const sizeClasses = {
    xs: "px-3 py-2 text-theme-xs",
    sm: "px-4 py-2.5 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-brand-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-brand-500/10 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-gray-200",
    danger:
      "bg-error-50 text-error-600 ring-1 ring-inset ring-error-200 hover:bg-error-100 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-error-500/15 dark:bg-error-500/15 dark:text-error-400 dark:ring-error-500/30",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
