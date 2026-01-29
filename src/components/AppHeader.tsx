"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Locale, t } from "@/lib/i18n";

type AppHeaderProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  overline?: string;
  title: string;
  subtitle?: string;
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
  overline,
  title,
  subtitle,
  actions,
  showSignOut = true,
  workspace
}: AppHeaderProps) {
  const pathname = usePathname();
  const isSettings = pathname?.startsWith("/settings");

  return (
    <header className="rounded-[28px] border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm">
              Om
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-neutral-400">
                {t(locale, "appTitle", "Program OMSI")}
              </p>
              <p className="text-sm font-semibold text-neutral-900">Convex</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 shadow-sm">
            <Link
              href="/"
              className={`rounded-full px-3 py-2 transition ${
                !isSettings ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {t(locale, "navDashboard", "Dashboard")}
            </Link>
            <Link
              href="/settings"
              className={`rounded-full px-3 py-2 transition ${
                isSettings ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {t(locale, "navSettings", "Settings")}
            </Link>
          </nav>
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500 shadow-sm">
            <span className="font-semibold uppercase tracking-wide">{t(locale, "language", "Language")}</span>
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
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 transition hover:border-neutral-400"
            >
              {t(locale, "signOut", "Sign out")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-neutral-200 pt-4">
        <div>
          {overline ? (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">{overline}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-semibold text-neutral-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-neutral-500">{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
}
