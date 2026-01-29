"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Locale, t } from "@/lib/i18n";
import { IconButton, IconLink } from "@/components/IconButton";
import { IconGlobe, IconGrid, IconSettings, IconSignOut } from "@/components/icons";

type AppHeaderProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  title: string;
  actions?: ReactNode;
  showSignOut?: boolean;
  workspace?: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
  };
};

export function AppHeader({
  locale,
  onLocaleChange,
  title,
  actions,
  showSignOut = true,
  workspace
}: AppHeaderProps) {
  const pathname = usePathname();
  const isSettings = pathname?.startsWith("/settings");

  return (
    <header className="rounded-[24px] border border-neutral-200 bg-white/90 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-neutral-900 text-[10px] font-semibold uppercase tracking-[0.3em] text-white shadow-sm">
            Om
          </div>
          <span className="text-lg font-semibold text-neutral-900">{title}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {workspace ? (
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500 shadow-sm">
              <span className="font-semibold uppercase tracking-wide">{workspace.label}</span>
              <select
                value={workspace.value}
                onChange={(event) => workspace.onChange(event.target.value)}
                className="bg-transparent text-xs font-semibold text-neutral-700"
              >
                {workspace.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <nav className="flex items-center gap-2">
            <IconLink
              href="/"
              label={t(locale, "navDashboard", "Dashboard")}
              variant={!isSettings ? "primary" : "default"}
            >
              <IconGrid className="h-4 w-4" />
            </IconLink>
            <IconLink
              href="/settings"
              label={t(locale, "navSettings", "Settings")}
              variant={isSettings ? "primary" : "default"}
            >
              <IconSettings className="h-4 w-4" />
            </IconLink>
          </nav>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500 shadow-sm">
            <div className="group relative flex items-center">
              <IconGlobe className="h-4 w-4 text-neutral-500" />
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 shadow-sm transition group-hover:opacity-100">
                {t(locale, "language", "Language")}
              </span>
            </div>
            <select
              value={locale}
              onChange={(event) => onLocaleChange(event.target.value as Locale)}
              className="bg-transparent text-xs font-semibold text-neutral-600"
            >
              <option value="sk">SK</option>
              <option value="en">EN</option>
            </select>
          </div>
          {showSignOut ? (
            <IconButton label={t(locale, "signOut", "Sign out")} onClick={() => signOut({ callbackUrl: "/login" })}>
              <IconSignOut className="h-4 w-4" />
            </IconButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}
