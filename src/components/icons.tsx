"use client";

import { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function IconBase({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconGrid({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </IconBase>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-1.9 3.3-0.2-.1a1.7 1.7 0 0 0-2.1.6l-0.1.2h-3.8l-0.1-.2a1.7 1.7 0 0 0-2.1-.6l-0.2.1-1.9-3.3.1-.1a1.7 1.7 0 0 0 .3-1.8l-.1-.2-1.9-3.3.2-.1a1.7 1.7 0 0 0 1-.7 1.7 1.7 0 0 0 0-1.3l-.1-.2 1.9-3.3.2.1a1.7 1.7 0 0 0 2.1-.6l.1-.2h3.8l.1.2a1.7 1.7 0 0 0 2.1.6l.2-.1 1.9 3.3-.1.2a1.7 1.7 0 0 0 0 1.3 1.7 1.7 0 0 0 1 .7l.2.1-1.9 3.3-.1.2z" />
    </IconBase>
  );
}

export function IconSignOut({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  );
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M15 18l-6-6 6-6" />
    </IconBase>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M9 6l6 6-6 6" />
    </IconBase>
  );
}

export function IconPencil({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </IconBase>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </IconBase>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
    </IconBase>
  );
}

export function IconGlobe({ className }: IconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20" />
      <path d="M12 2a15 15 0 0 0 0 20" />
    </IconBase>
  );
}
