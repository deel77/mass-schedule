
"use client";

import { useEffect, useMemo, useState } from "react";
import { Locale, t } from "@/lib/i18n";
import { AppHeader } from "@/components/AppHeader";

type Parish = { _id: string; name: string; slug: string; description?: string };

type Location = {
  _id: string;
  parishId: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
};

type User = {
  _id: string;
  name: string;
  email: string;
  isSuperadmin: boolean;
  parishIds: string[];
};

type Token = {
  _id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  parishIds: string[];
  isActive: boolean;
  lastUsedAt?: number;
};

const TOKEN_SCOPES = ["read:weeks", "read:days", "read:locations"];

function formatDate(value: number | undefined, locale: Locale) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString(locale === "sk" ? "sk-SK" : "en-US");
}

function formatStatus(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), value),
    template
  );
}

export function SettingsClient({ isSuperadmin }: { isSuperadmin: boolean }) {
  const [parishes, setParishes] = useState<Parish[]>([]);
  const [locationsByParish, setLocationsByParish] = useState<Record<string, Location[]>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("sk");

  const loadParishes = async () => {
    const response = await fetch("/api/parishes");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setParishes(data.parishes || []);
  };

  const loadLocations = async (parishId: string) => {
    const response = await fetch(`/api/locations?parishId=${parishId}`);
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setLocationsByParish((prev) => ({ ...prev, [parishId]: data.locations || [] }));
  };

  const loadUsers = async () => {
    const response = await fetch("/api/users");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setUsers(data.users || []);
  };

  const loadTokens = async () => {
    const response = await fetch("/api/tokens");
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setTokens(data.tokens || []);
  };

  useEffect(() => {
    loadParishes();
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("locale") : null;
    if (stored === "en" || stored === "sk") {
      setLocale(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("locale", locale);
    }
  }, [locale]);

  useEffect(() => {
    parishes.forEach((parish) => {
      if (!locationsByParish[parish._id]) {
        loadLocations(parish._id);
      }
    });
  }, [parishes]);

  useEffect(() => {
    if (isSuperadmin) {
      loadUsers();
      loadTokens();
    }
  }, [isSuperadmin]);

  const totalLocations = useMemo(
    () => Object.values(locationsByParish).reduce((acc, list) => acc + list.length, 0),
    [locationsByParish]
  );

  const createParish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description")
    };
    const response = await fetch("/api/parishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to create parish");
      return;
    }
    setStatus(t(locale, "statusParishCreated", "Parish created."));
    loadParishes();
    event.currentTarget.reset();
  };

  const updateParish = async (parish: Parish, patch: Partial<Parish>) => {
    const response = await fetch(`/api/parishes/${parish._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: patch.name ?? parish.name,
        slug: patch.slug ?? parish.slug,
        description: patch.description ?? parish.description
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to update parish");
      return;
    }
    setStatus(t(locale, "statusParishUpdated", "Parish updated."));
    loadParishes();
  };

  const deleteParish = async (parishId: string) => {
    const response = await fetch(`/api/parishes/${parishId}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to delete parish");
      return;
    }
    setStatus(t(locale, "statusParishDeleted", "Parish deleted."));
    loadParishes();
  };

  const createLocation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      parishId: form.get("parishId"),
      name: form.get("name"),
      slug: form.get("slug"),
      description: form.get("description"),
      displayOrder: form.get("displayOrder") ? Number(form.get("displayOrder")) : undefined
    };
    const response = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to create location");
      return;
    }
    setStatus(t(locale, "statusLocationCreated", "Location created."));
    if (typeof body.parishId === "string") {
      loadLocations(body.parishId);
    }
    event.currentTarget.reset();
  };

  const updateLocation = async (location: Location, patch: Partial<Location>) => {
    const response = await fetch(`/api/locations/${location._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: patch.name ?? location.name,
        slug: patch.slug ?? location.slug,
        description: patch.description ?? location.description,
        displayOrder: patch.displayOrder ?? location.displayOrder
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to update location");
      return;
    }
    setStatus(t(locale, "statusLocationUpdated", "Location updated."));
    loadLocations(location.parishId);
  };

  const deleteLocation = async (location: Location) => {
    const response = await fetch(`/api/locations/${location._id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to delete location");
      return;
    }
    setStatus(t(locale, "statusLocationDeleted", "Location deleted."));
    loadLocations(location.parishId);
  };

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parishIds = form.getAll("parishIds");
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      isSuperadmin: form.get("isSuperadmin") === "on",
      parishIds
    };
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to create user");
      return;
    }
    if (payload.generatedPassword) {
      setStatus(
        formatStatus(
          t(locale, "statusUserCreatedGenerated", "User created. Generated password: {password}"),
          { password: payload.generatedPassword }
        )
      );
    } else {
      setStatus(t(locale, "statusUserCreated", "User created."));
    }
    loadUsers();
    event.currentTarget.reset();
  };

  const updateUser = async (user: User, patch: Partial<User> & { password?: string }) => {
    const response = await fetch(`/api/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: patch.name ?? user.name,
        email: patch.email ?? user.email,
        password: patch.password,
        isSuperadmin: patch.isSuperadmin ?? user.isSuperadmin,
        parishIds: patch.parishIds ?? user.parishIds
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to update user");
      return;
    }
    setStatus(t(locale, "statusUserUpdated", "User updated."));
    loadUsers();
  };

  const createToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parishIds = form.getAll("tokenParishIds");
    const scopes = form.getAll("tokenScopes");
    const body = {
      name: form.get("name"),
      parishIds,
      scopes
    };
    const response = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to create token");
      return;
    }
    setNewToken(payload.token);
    setStatus(t(locale, "statusTokenCreated", "Token created. Copy it now - it will not be shown again."));
    loadTokens();
    event.currentTarget.reset();
  };

  const updateToken = async (token: Token, patch: Partial<Token>) => {
    const response = await fetch(`/api/tokens/${token._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: patch.name ?? token.name,
        parishIds: patch.parishIds ?? token.parishIds,
        scopes: patch.scopes ?? token.scopes,
        isActive: patch.isActive ?? token.isActive
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.message || "Failed to update token");
      return;
    }
    setStatus(t(locale, "statusTokenUpdated", "Token updated."));
    loadTokens();
  };

  const stats = [
    { label: t(locale, "statsParishes", "Parishes"), value: parishes.length },
    { label: t(locale, "statsLocations", "Locations"), value: totalLocations },
    { label: t(locale, "statsUsers", "Users"), value: users.length },
    { label: t(locale, "statsTokens", "API tokens"), value: tokens.length }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fdfaf5_40%,_#f5f1ea_100%)] px-6 py-10">
      <div className="pointer-events-none absolute -top-20 right-[-120px] h-64 w-64 rounded-full bg-orange-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-80px] h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <AppHeader
          locale={locale}
          onLocaleChange={setLocale}
          overline={t(locale, "settingsOverline", "Administration")}
          title={t(locale, "settingsTitle", "Settings")}
          subtitle={t(locale, "manageSubtitle", "Manage parishes, locations, users, and external access tokens.")}
        />

        {status ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
            {status}
          </div>
        ) : null}

        {isSuperadmin ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-neutral-900">{stat.value}</p>
              </div>
            ))}
          </section>
        ) : null}

        {isSuperadmin ? (
          <section className="rounded-[32px] border border-neutral-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                  {t(locale, "parishesTitle", "Parishes")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
                  {t(locale, "manageParishes", "Manage parishes")}
                </h2>
              </div>
              <span className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-700">
                {parishes.length} {t(locale, "parishCountLabel", "total")}
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-neutral-900">{t(locale, "addParish", "Add parish")}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {t(locale, "createParishHint", "Create a new parish and optionally set a slug and description.")}
                </p>
                <form onSubmit={createParish} className="mt-4 grid gap-3">
                  <input
                    name="name"
                    placeholder={t(locale, "parishNamePlaceholder", "Parish name")}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                    required
                  />
                  <input
                    name="slug"
                    placeholder={t(locale, "slugOptionalPlaceholder", "Slug (optional)")}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                  />
                  <textarea
                    name="description"
                    placeholder={t(locale, "descriptionPlaceholder", "Description")}
                    className="min-h-[80px] rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                  />
                  <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                    {t(locale, "addParish", "Add parish")}
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {parishes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
                    {t(locale, "emptyState", "No items yet.")}
                  </div>
                ) : (
                  parishes.map((parish) => (
                    <details key={parish._id} className="group rounded-2xl border border-neutral-200 bg-white p-4">
                      <summary className="flex list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <div>
                          <p className="text-base font-semibold text-neutral-900">{parish.name}</p>
                          <p className="text-xs text-neutral-500">
                            {parish.slug || t(locale, "slugOptionalPlaceholder", "Slug (optional)")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                            {(locationsByParish[parish._id] || []).length} {t(locale, "statsLocations", "Locations")}
                          </span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition group-open:rotate-180">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </span>
                        </div>
                      </summary>
                      <div className="mt-4 grid gap-3 border-t border-neutral-200 pt-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            defaultValue={parish.name}
                            onBlur={(e) => updateParish(parish, { name: e.target.value })}
                            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                          />
                          <input
                            defaultValue={parish.slug}
                            onBlur={(e) => updateParish(parish, { slug: e.target.value })}
                            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                          />
                        </div>
                        <textarea
                          defaultValue={parish.description}
                          onBlur={(e) => updateParish(parish, { description: e.target.value })}
                          className="min-h-[70px] rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-500">
                            {t(locale, "manageLabel", "Manage details")}
                          </span>
                          <button
                            onClick={() => deleteParish(parish._id)}
                            className="text-xs font-semibold uppercase tracking-wide text-red-500"
                          >
                            {t(locale, "deleteLabel", "Delete")}
                          </button>
                        </div>
                      </div>
                    </details>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {isSuperadmin ? (
          <section className="rounded-[32px] border border-neutral-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                  {t(locale, "addLocationLabel", "Add location")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
                  {t(locale, "manageLocations", "Manage locations")}
                </h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700">
                {totalLocations} {t(locale, "statsLocations", "Locations")}
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-neutral-900">{t(locale, "addLocation", "Add location")}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {t(locale, "createLocationHint", "Add a location within a parish and control its ordering.")}
                </p>
                <form onSubmit={createLocation} className="mt-4 grid gap-3">
                  <select
                    name="parishId"
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                    required
                  >
                    <option value="">{t(locale, "selectParish", "Select parish")}</option>
                    {parishes.map((parish) => (
                      <option key={parish._id} value={parish._id}>
                        {parish.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="name"
                    placeholder={t(locale, "locationNamePlaceholder", "Location name")}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                    required
                  />
                  <input
                    name="slug"
                    placeholder={t(locale, "slugOptionalPlaceholder", "Slug (optional)")}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                  />
                  <input
                    name="displayOrder"
                    placeholder={t(locale, "displayOrderPlaceholder", "Display order")}
                    type="number"
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                  />
                  <textarea
                    name="description"
                    placeholder={t(locale, "descriptionPlaceholder", "Description")}
                    className="min-h-[80px] rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                  />
                  <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                    {t(locale, "addLocation", "Add location")}
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {parishes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
                    {t(locale, "emptyState", "No items yet.")}
                  </div>
                ) : (
                  parishes.map((parish) => (
                    <details key={parish._id} className="group rounded-2xl border border-neutral-200 bg-white p-4">
                      <summary className="flex list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <div>
                          <p className="text-base font-semibold text-neutral-900">{parish.name}</p>
                          <p className="text-xs text-neutral-500">{t(locale, "locationsGroupLabel", "Locations")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                            {(locationsByParish[parish._id] || []).length}
                          </span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition group-open:rotate-180">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </span>
                        </div>
                      </summary>
                      <div className="mt-4 space-y-3 border-t border-neutral-200 pt-4">
                        {(locationsByParish[parish._id] || []).length === 0 ? (
                          <p className="text-sm text-neutral-500">{t(locale, "emptyState", "No items yet.")}</p>
                        ) : (
                          (locationsByParish[parish._id] || []).map((location) => (
                            <div key={location._id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                              <div className="grid gap-3 md:grid-cols-3">
                                <input
                                  defaultValue={location.name}
                                  onBlur={(e) => updateLocation(location, { name: e.target.value })}
                                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                                />
                                <input
                                  defaultValue={location.slug}
                                  onBlur={(e) => updateLocation(location, { slug: e.target.value })}
                                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                                />
                                <input
                                  defaultValue={location.displayOrder}
                                  type="number"
                                  onBlur={(e) => updateLocation(location, { displayOrder: Number(e.target.value) })}
                                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                                />
                              </div>
                              <textarea
                                defaultValue={location.description}
                                onBlur={(e) => updateLocation(location, { description: e.target.value })}
                                className="mt-3 min-h-[60px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                              />
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-neutral-500">{location.slug}</span>
                                <button
                                  onClick={() => deleteLocation(location)}
                                  className="text-xs font-semibold uppercase tracking-wide text-red-500"
                                >
                                  {t(locale, "deleteLabel", "Delete")}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </details>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {isSuperadmin ? (
          <section className="rounded-[32px] border border-neutral-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                  {t(locale, "usersTitle", "Users")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
                  {t(locale, "manageUsers", "Manage users")}
                </h2>
              </div>
              <span className="rounded-full bg-indigo-100 px-4 py-2 text-xs font-semibold text-indigo-700">
                {users.length} {t(locale, "statsUsers", "Users")}
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-neutral-900">{t(locale, "addUser", "Add user")}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {t(locale, "createUserHint", "Invite a user and choose which parishes they can manage.")}
                </p>
                <form onSubmit={createUser} className="mt-4 grid gap-3">
                  <input
                    name="name"
                    placeholder={t(locale, "namePlaceholder", "Name")}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder={t(locale, "emailPlaceholder", "Email")}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder={t(locale, "passwordOptionalPlaceholder", "Password (optional)")}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                  />
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t(locale, "parishesLabel", "Parishes")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {parishes.map((parish) => (
                      <label
                        key={parish._id}
                        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
                      >
                        <input type="checkbox" name="parishIds" value={parish._id} />
                        {parish.name}
                      </label>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-neutral-600">
                    <input type="checkbox" name="isSuperadmin" /> {t(locale, "superadminLabel", "Superadmin")}
                  </label>
                  <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                    {t(locale, "addUser", "Add user")}
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {users.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
                    {t(locale, "emptyState", "No items yet.")}
                  </div>
                ) : (
                  users.map((user) => (
                    <details key={user._id} className="group rounded-2xl border border-neutral-200 bg-white p-4">
                      <summary className="flex list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <div>
                          <p className="text-base font-semibold text-neutral-900">{user.name}</p>
                          <p className="text-xs text-neutral-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {user.isSuperadmin ? (
                            <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                              {t(locale, "superadminLabel", "Superadmin")}
                            </span>
                          ) : null}
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition group-open:rotate-180">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </span>
                        </div>
                      </summary>
                      <div className="mt-4 grid gap-3 border-t border-neutral-200 pt-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            defaultValue={user.name}
                            onBlur={(e) => updateUser(user, { name: e.target.value })}
                            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                          />
                          <input
                            defaultValue={user.email}
                            onBlur={(e) => updateUser(user, { email: e.target.value })}
                            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                            {t(locale, "parishesLabel", "Parishes")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {parishes.map((parish) => (
                              <label
                                key={parish._id}
                                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
                              >
                                <input
                                  type="checkbox"
                                  checked={user.parishIds.includes(parish._id)}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...user.parishIds, parish._id]
                                      : user.parishIds.filter((id) => id !== parish._id);
                                    updateUser(user, { parishIds: next });
                                  }}
                                />
                                {parish.name}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 text-xs text-neutral-600">
                            <input
                              type="checkbox"
                              checked={user.isSuperadmin}
                              onChange={(e) => updateUser(user, { isSuperadmin: e.target.checked })}
                            />
                            {t(locale, "superadminLabel", "Superadmin")}
                          </label>
                          <button
                            onClick={() => {
                              const password = prompt(
                                t(locale, "passwordResetPrompt", "New password (leave blank to skip)")
                              );
                              if (password) {
                                updateUser(user, { password });
                              }
                            }}
                            className="text-xs font-semibold uppercase tracking-wide text-neutral-400"
                          >
                            {t(locale, "resetPasswordLabel", "Reset password")}
                          </button>
                        </div>
                      </div>
                    </details>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        {isSuperadmin ? (
          <section className="rounded-[32px] border border-neutral-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                  {t(locale, "externalTokensTitle", "External API tokens")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-900">
                  {t(locale, "manageTokens", "Manage access tokens")}
                </h2>
              </div>
              <span className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700">
                {tokens.length} {t(locale, "statsTokens", "API tokens")}
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-neutral-900">{t(locale, "createToken", "Create token")}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  {t(locale, "createTokenHint", "Create a token for external apps and restrict its scope.")}
                </p>
                {newToken ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    {t(locale, "tokenCreated", "Token created. Copy it now - it will not be shown again.")}{" "}                    <strong>{newToken}</strong>
                  </div>
                ) : null}
                <form onSubmit={createToken} className="mt-4 grid gap-3">
                  <input
                    name="name"
                    placeholder={t(locale, "apiTokenNamePlaceholder", "Token name")}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
                    required
                  />
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t(locale, "parishesLabel", "Parishes")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {parishes.map((parish) => (
                      <label
                        key={parish._id}
                        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
                      >
                        <input type="checkbox" name="tokenParishIds" value={parish._id} />
                        {parish.name}
                      </label>
                    ))}
                  </div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {t(locale, "scopesLabel", "Scopes")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TOKEN_SCOPES.map((scope) => (
                      <label
                        key={scope}
                        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
                      >
                        <input type="checkbox" name="tokenScopes" value={scope} />
                        {scope}
                      </label>
                    ))}
                  </div>
                  <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                    {t(locale, "createToken", "Create token")}
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {tokens.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
                    {t(locale, "emptyState", "No items yet.")}
                  </div>
                ) : (
                  tokens.map((token) => (
                    <details key={token._id} className="group rounded-2xl border border-neutral-200 bg-white p-4">
                      <summary className="flex list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                        <div>
                          <p className="text-base font-semibold text-neutral-900">{token.name}</p>
                          <p className="text-xs text-neutral-500">
                            {t(locale, "prefixLabel", "Prefix")}: {token.tokenPrefix}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              token.isActive ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {token.isActive
                              ? t(locale, "activeLabel", "Active")
                              : t(locale, "inactiveLabel", "Inactive")}
                          </span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition group-open:rotate-180">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </span>
                        </div>
                      </summary>
                      <div className="mt-4 grid gap-3 border-t border-neutral-200 pt-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            defaultValue={token.name}
                            onBlur={(e) => updateToken(token, { name: e.target.value })}
                            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                          />
                          <label className="flex items-center gap-2 text-xs text-neutral-600">
                            <input
                              type="checkbox"
                              checked={token.isActive}
                              onChange={(e) => updateToken(token, { isActive: e.target.checked })}
                            />
                            {t(locale, "activeLabel", "Active")}
                          </label>
                        </div>
                        <div className="text-xs text-neutral-500">
                          {t(locale, "lastUsedLabel", "Last used")}: {formatDate(token.lastUsedAt, locale)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                            {t(locale, "parishesLabel", "Parishes")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {parishes.map((parish) => (
                              <label
                                key={parish._id}
                                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
                              >
                                <input
                                  type="checkbox"
                                  checked={token.parishIds.includes(parish._id)}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...token.parishIds, parish._id]
                                      : token.parishIds.filter((id) => id !== parish._id);
                                    updateToken(token, { parishIds: next });
                                  }}
                                />
                                {parish.name}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                            {t(locale, "scopesLabel", "Scopes")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {TOKEN_SCOPES.map((scope) => (
                              <label
                                key={scope}
                                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600"
                              >
                                <input
                                  type="checkbox"
                                  checked={token.scopes.includes(scope)}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...token.scopes, scope]
                                      : token.scopes.filter((item) => item !== scope);
                                    updateToken(token, { scopes: next });
                                  }}
                                />
                                {scope}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
