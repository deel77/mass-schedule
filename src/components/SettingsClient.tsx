"use client";

import { useEffect, useState } from "react";
import { Locale, t } from "@/lib/i18n";

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

function formatDate(value?: number) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
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

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-neutral-900">
                {t(locale, "settingsTitle", "Settings")}
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                {t(locale, "manageSubtitle", "Manage parishes, locations, users, and external access tokens.")}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500">
              <span className="font-semibold uppercase tracking-wide">{t(locale, "language", "Language")}</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
                className="bg-transparent text-xs font-semibold text-neutral-600"
              >
                <option value="sk">SK</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>
        </header>

        {status ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            {status}
          </div>
        ) : null}

        {isSuperadmin ? (
          <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-900">
                {t(locale, "parishesTitle", "Parishes")}
              </h2>
              <form onSubmit={createParish} className="mt-4 grid gap-3">
                <input
                  name="name"
                  placeholder={t(locale, "parishNamePlaceholder", "Parish name")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                  required
                />
                <input
                  name="slug"
                  placeholder={t(locale, "slugOptionalPlaceholder", "Slug (optional)")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                />
                <input
                  name="description"
                  placeholder={t(locale, "descriptionPlaceholder", "Description")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                />
                <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                  {t(locale, "addParish", "Add parish")}
                </button>
              </form>

              <div className="mt-6 space-y-4">
                {parishes.map((parish) => (
                  <div key={parish._id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        defaultValue={parish.name}
                        onBlur={(e) => updateParish(parish, { name: e.target.value })}
                        className="flex-1 rounded-xl border px-3 py-2 text-sm"
                      />
                      <input
                        defaultValue={parish.slug}
                        onBlur={(e) => updateParish(parish, { slug: e.target.value })}
                        className="w-32 rounded-xl border px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => deleteParish(parish._id)}
                        className="text-xs font-semibold uppercase tracking-wide text-red-500"
                      >
                        {t(locale, "deleteLabel", "Delete")}
                      </button>
                    </div>
                    <input
                      defaultValue={parish.description}
                      onBlur={(e) => updateParish(parish, { description: e.target.value })}
                      className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-900">
                {t(locale, "addLocationLabel", "Add location")}
              </h2>
              <form onSubmit={createLocation} className="mt-4 grid gap-3">
                <select name="parishId" className="rounded-2xl border px-4 py-2 text-sm" required>
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
                  className="rounded-2xl border px-4 py-2 text-sm"
                  required
                />
                <input
                  name="slug"
                  placeholder={t(locale, "slugOptionalPlaceholder", "Slug (optional)")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                />
                <input
                  name="displayOrder"
                  placeholder={t(locale, "displayOrderPlaceholder", "Display order")}
                  type="number"
                  className="rounded-2xl border px-4 py-2 text-sm"
                />
                <input
                  name="description"
                  placeholder={t(locale, "descriptionPlaceholder", "Description")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                />
                <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                  {t(locale, "addLocation", "Add location")}
                </button>
              </form>

              <div className="mt-6 space-y-4">
                {parishes.map((parish) => (
                  <div key={parish._id} className="space-y-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
                      {parish.name}
                    </h3>
                    {(locationsByParish[parish._id] || []).map((location) => (
                      <div key={location._id} className="rounded-xl border border-neutral-200 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            defaultValue={location.name}
                            onBlur={(e) => updateLocation(location, { name: e.target.value })}
                            className="flex-1 rounded-xl border px-2 py-1 text-xs"
                          />
                          <input
                            defaultValue={location.slug}
                            onBlur={(e) => updateLocation(location, { slug: e.target.value })}
                            className="w-24 rounded-xl border px-2 py-1 text-xs"
                          />
                          <input
                            defaultValue={location.displayOrder}
                            type="number"
                            onBlur={(e) => updateLocation(location, { displayOrder: Number(e.target.value) })}
                            className="w-20 rounded-xl border px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => deleteLocation(location)}
                            className="text-[10px] font-semibold uppercase tracking-wide text-red-500"
                          >
                            {t(locale, "deleteLabel", "Delete")}
                          </button>
                        </div>
                        <input
                          defaultValue={location.description}
                          onBlur={(e) => updateLocation(location, { description: e.target.value })}
                          className="mt-2 w-full rounded-xl border px-2 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {isSuperadmin ? (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-900">
                {t(locale, "usersTitle", "Users")}
              </h2>
              <form onSubmit={createUser} className="mt-4 grid gap-3">
                <input
                  name="name"
                  placeholder={t(locale, "namePlaceholder", "Name")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder={t(locale, "emailPlaceholder", "Email")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder={t(locale, "passwordOptionalPlaceholder", "Password (optional)")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                />
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {t(locale, "parishesLabel", "Parishes")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {parishes.map((parish) => (
                    <label key={parish._id} className="flex items-center gap-2 text-xs text-neutral-600">
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

              <div className="mt-6 space-y-4">
                {users.map((user) => (
                  <div key={user._id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        defaultValue={user.name}
                        onBlur={(e) => updateUser(user, { name: e.target.value })}
                        className="flex-1 rounded-xl border px-3 py-2 text-sm"
                      />
                      <input
                        defaultValue={user.email}
                        onBlur={(e) => updateUser(user, { email: e.target.value })}
                        className="flex-1 rounded-xl border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parishes.map((parish) => (
                        <label key={parish._id} className="flex items-center gap-2 text-xs text-neutral-600">
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
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-600">
                      <label className="flex items-center gap-2">
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
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-900">
                {t(locale, "externalTokensTitle", "External API tokens")}
              </h2>
              {newToken ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  {t(locale, "tokenCreated", "Token created. Copy it now - it will not be shown again.")}{" "}
                  <strong>{newToken}</strong>
                </div>
              ) : null}
              <form onSubmit={createToken} className="mt-4 grid gap-3">
                <input
                  name="name"
                  placeholder={t(locale, "apiTokenNamePlaceholder", "Token name")}
                  className="rounded-2xl border px-4 py-2 text-sm"
                  required
                />
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {t(locale, "parishesLabel", "Parishes")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {parishes.map((parish) => (
                    <label key={parish._id} className="flex items-center gap-2 text-xs text-neutral-600">
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
                    <label key={scope} className="flex items-center gap-2 text-xs text-neutral-600">
                      <input type="checkbox" name="tokenScopes" value={scope} />
                      {scope}
                    </label>
                  ))}
                </div>
                <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                  {t(locale, "createToken", "Create token")}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {tokens.map((token) => (
                  <div key={token._id} className="rounded-2xl border border-neutral-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <input
                          defaultValue={token.name}
                          onBlur={(e) => updateToken(token, { name: e.target.value })}
                          className="rounded-xl border px-3 py-2 text-sm"
                        />
                        <p className="mt-1 text-xs text-neutral-400">
                          {t(locale, "prefixLabel", "Prefix")}: {token.tokenPrefix}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-neutral-600">
                        <input
                          type="checkbox"
                          checked={token.isActive}
                          onChange={(e) => updateToken(token, { isActive: e.target.checked })}
                        />
                        {t(locale, "activeLabel", "Active")}
                      </label>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">
                      {t(locale, "lastUsedLabel", "Last used")}: {formatDate(token.lastUsedAt)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {parishes.map((parish) => (
                        <label key={parish._id} className="flex items-center gap-2 text-neutral-600">
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
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {TOKEN_SCOPES.map((scope) => (
                        <label key={scope} className="flex items-center gap-2 text-neutral-600">
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
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
