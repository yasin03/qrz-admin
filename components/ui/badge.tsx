import * as React from "react";

import { cn } from "@/lib/utils";

type CustomBadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "purple"
  | "pink"
  | "orange"
  | "blue"
  | "cyan"
  | "indigo"
  | "teal"
  | "gray";

type CustomBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: CustomBadgeVariant;
};

const variantClasses: Record<CustomBadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",

  primary: "bg-primary/10 text-primary",

  secondary: "bg-secondary text-secondary-foreground",

  success:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",

  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",

  warning:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",

  info: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",

  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",

  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",

  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",

  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",

  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",

  indigo:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",

  teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",

  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: CustomBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
