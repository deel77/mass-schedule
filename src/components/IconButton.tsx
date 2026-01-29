"use client";

import Link from "next/link";
import { ReactNode } from "react";

type IconButtonProps = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
};

const sizeClasses: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-9 w-9 text-sm",
  lg: "h-10 w-10 text-base"
};

const variantClasses: Record<NonNullable<IconButtonProps["variant"]>, string> = {
  default: "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
  primary: "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800",
  danger: "border-transparent bg-red-50 text-red-600 hover:bg-red-100",
  ghost: "border-transparent bg-transparent text-neutral-500 hover:bg-neutral-100"
};

function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 shadow-sm transition group-hover/icon:opacity-100 group-focus-visible/icon:opacity-100">
      {label}
    </span>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  variant = "default",
  size = "md",
  className,
  children
}: IconButtonProps) {
  const classes = `group/icon relative inline-flex items-center justify-center rounded-full border shadow-sm transition ${sizeClasses[size]} ${variantClasses[variant]} ${
    disabled ? "opacity-60" : ""
  } ${className || ""}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={classes}
    >
      {children}
      <Tooltip label={label} />
    </button>
  );
}

export function IconLink({
  label,
  href,
  children,
  variant = "default",
  size = "md",
  className
}: IconButtonProps) {
  const classes = `group/icon relative inline-flex items-center justify-center rounded-full border shadow-sm transition ${sizeClasses[size]} ${variantClasses[variant]} ${
    className || ""
  }`;

  return (
    <Link href={href || "#"} aria-label={label} title={label} className={classes}>
      {children}
      <Tooltip label={label} />
    </Link>
  );
}
