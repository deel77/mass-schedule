"use client";

import { useEffect, useMemo, useState } from "react";
import { Locale, t } from "@/lib/i18n";
import { AppHeader } from "@/components/AppHeader";
import { IconButton } from "@/components/IconButton";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconRefresh,
  IconTrash
} from "@/components/icons";

const DAY_NAMES_SK = [
  "Pondelok",
  "Utorok",
  "Streda",
  "Štvrtok",
  "Piatok",
  "Sobota",
  "Nedeľa"
];

const EVENT_TYPES = [
  { value: "holy-mass", key: "eventTypeHolyMass" },
  { value: "confession", key: "eventTypeConfession" },
  { value: "other", key: "eventTypeOther" }
];

type Parish = { _id: string; name: string; slug: string };

type Location = {
  _id: string;
  name: string;
  slug: string;
  displayOrder: number;
};

type WeekView = {
  parish: Parish;
  week: { start_date: string; end_date: string; label: string | null };
  schedule: Array<{
    day: string;
    date: string;
    info: string | null;
    locations: Array<{
      id: string;
      name: string;
      slug: string;
      events: Array<{
        type: string;
        time: string;
        intention: string | null;
        info: string | null;
      }>;
    }>;
  }>;
};

type BuilderEvent = {
  type: string;
  time: string;
  intention: string;
  info: string;
};

type BuilderLocation = {
  locationId: string | null;
  events: BuilderEvent[];
};

type BuilderDay = {
  dayName: string;
  date: string;
  info: string;
  locations: BuilderLocation[];
};

type BuilderState = {
  weekLabel: string;
  days: BuilderDay[];
};

type DashboardProps = {
  parishes: Parish[];
  initialParishId: string;
  initialWeek: WeekView | null;
  initialLocations: Location[];
  userName: string;
};

function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getWeekStart(date: string) {
  const base = new Date(date);
  const day = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - day);
  return base;
}

function normalizePayload(payload: any) {
  if (Array.isArray(payload.days)) {
    return payload;
  }
  if (Array.isArray(payload.schedule)) {
    return {
      weekLabel: payload.season || "",
      days: payload.schedule.map((day: any) => ({
        dayName: day.day,
        date: convertDateToIso(day.date),
        info: day.info || "",
        locations: (day.locations || []).map((location: any) => ({
          locationName: location.name,
          events: location.events || []
        }))
      }))
    };
  }
  return payload;
}

function convertDateToIso(value: string) {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const compact = trimmed.replace(/\s+/g, "");
  const parts = compact.split(".");
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return trimmed;
}

function convertIsoToDisplay(value: string) {
  if (!value) {
    return "";
  }
  const parts = value.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = String(Number(parts[1]));
    const day = String(Number(parts[2]));
    return `${day}.${month}.${year}`;
  }
  return value;
}

function buildFromWeek(
  week: WeekView | null,
  locations: Location[],
  weekDate: string
): BuilderState {
  const lookup = new Map<string, Location>();
  locations.forEach((location) => lookup.set(location.slug, location));

  const base = getWeekStart(weekDate);
  const scheduleMap = new Map<string, any>();

  week?.schedule.forEach((day) => {
    scheduleMap.set(day.day, day);
  });

  const days: BuilderDay[] = DAY_NAMES_SK.map((dayName, index) => {
    const existing = scheduleMap.get(dayName);
    const date = existing?.date || toIso(new Date(base.getTime() + index * 86400000));
    const locationsForDay: BuilderLocation[] = (existing?.locations || []).map((loc: any) => {
      const match = lookup.get(loc.slug) || locations.find((item) => item.name === loc.name);
      return {
        locationId: match?._id || null,
        events: (loc.events || []).map((event: any) => ({
          type: event.type,
          time: event.time,
          intention: event.intention || "",
          info: event.info || ""
        }))
      };
    });

    return {
      dayName,
      date,
      info: existing?.info || "",
      locations: locationsForDay
    };
  });

  return {
    weekLabel: week?.week.label || "",
    days
  };
}

function buildPayload(builder: BuilderState, locations: Location[]) {
  const locationMap = new Map(locations.map((location) => [location._id, location.name]));
  return {
    season: builder.weekLabel || null,
    schedule: builder.days.map((day) => ({
      day: day.dayName,
      date: convertIsoToDisplay(day.date),
      info: day.info || null,
      locations: day.locations
        .filter((location) => location.locationId)
        .map((location) => ({
          name: location.locationId ? locationMap.get(location.locationId) || "" : "",
          events: location.events.map((event) => ({
            type: event.type,
            time: event.time,
            intention: event.intention || null,
            info: event.info || null
          }))
        }))
    }))
  };
}

export function DashboardClient({
  parishes,
  initialParishId,
  initialWeek,
  initialLocations,
  userName
}: DashboardProps) {
  const [selectedParishId, setSelectedParishId] = useState(initialParishId);
  const [weekData, setWeekData] = useState<WeekView | null>(initialWeek);
  const [weekDate, setWeekDate] = useState(initialWeek?.week.start_date || toIso(new Date()));
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [builder, setBuilder] = useState<BuilderState>(() =>
    buildFromWeek(initialWeek, initialLocations, weekDate)
  );
  const [jsonText, setJsonText] = useState(JSON.stringify(buildPayload(builder, locations), null, 2));
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    null
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [locale, setLocale] = useState<Locale>("sk");

  const eventTypeLabel = (type: string) => {
    const match = EVENT_TYPES.find((item) => item.value === type);
    if (!match) {
      return type;
    }
    return t(locale, match.key, type);
  };

  const selectedParish = useMemo(
    () => parishes.find((parish) => parish._id === selectedParishId),
    [parishes, selectedParishId]
  );

  useEffect(() => {
    setJsonText(JSON.stringify(buildPayload(builder, locations), null, 2));
  }, [builder, locations]);

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

  const loadWeek = async (targetDate: string, parishId = selectedParishId) => {
    setLoadingWeek(true);
    try {
      const response = await fetch(`/api/weeks?date=${encodeURIComponent(targetDate)}&parish=${parishId}`);
      if (!response.ok) {
        throw new Error((await response.json()).message || "Failed to load week");
      }
      const data = await response.json();
      setWeekData(data);
      setWeekDate(data.week.start_date);
      const locationsResponse = await fetch(`/api/locations?parishId=${parishId}`);
      if (locationsResponse.ok) {
        const locPayload = await locationsResponse.json();
        setLocations(locPayload.locations || []);
        setBuilder(buildFromWeek(data, locPayload.locations || [], data.week.start_date));
      } else {
        setBuilder(buildFromWeek(data, locations, data.week.start_date));
      }
      setMessage({ type: "success", text: t(locale, "weekLoaded", "Week loaded.") });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoadingWeek(false);
    }
  };

  const handleParishChange = (nextParishId: string) => {
    setSelectedParishId(nextParishId);
    loadWeek(weekDate, nextParishId);
  };

  const shiftWeek = (offset: number) => {
    const base = getWeekStart(weekDate);
    base.setDate(base.getDate() + offset);
    const target = toIso(base);
    loadWeek(target);
  };

  const resetBuilder = () => {
    setBuilder(buildFromWeek(weekData, locations, weekDate));
    setMessage({ type: "info", text: t(locale, "editorReset", "Editor reset.") });
  };

  const applyJson = () => {
    try {
      const parsed = normalizePayload(JSON.parse(jsonText));
      if (!parsed.days) {
        throw new Error("Missing days in JSON payload");
      }
      const mapped = parsed.days.map((day: any) => ({
        dayName: day.dayName,
        date: convertDateToIso(day.date),
        info: day.info || "",
        locations: (day.locations || []).map((loc: any) => ({
          locationId:
            loc.locationId ||
            (loc.locationSlug
              ? locations.find((item) => item.slug === loc.locationSlug)?._id
              : null) ||
            (loc.locationName || loc.name
              ? locations.find(
                  (item) =>
                    item.name.toLowerCase() ===
                    String(loc.locationName || loc.name).toLowerCase()
                )?._id
              : null),
          events: (loc.events || []).map((event: any) => ({
            type: event.type || "holy-mass",
            time: event.time || "",
            intention: event.intention || "",
            info: event.info || ""
          }))
        }))
      }));
      setBuilder({ weekLabel: parsed.weekLabel || "", days: mapped });
      setMessage({ type: "success", text: t(locale, "jsonLoaded", "JSON loaded into editor.") });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(jsonText);
    setMessage({ type: "success", text: t(locale, "jsonCopied", "JSON copied to clipboard.") });
  };

  const saveSchedule = async () => {
    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parish: selectedParishId, ...buildPayload(builder, locations) })
      });
      if (!response.ok) {
        throw new Error((await response.json()).message || "Failed to save schedule");
      }
      const data = await response.json();
      setWeekData(data);
      setWeekDate(data.week.start_date);
      setEditorOpen(false);
      setMessage({ type: "success", text: t(locale, "scheduleSaved", "Schedule saved.") });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const updateDay = (index: number, patch: Partial<BuilderDay>) => {
    setBuilder((prev) => {
      const next = [...prev.days];
      next[index] = { ...next[index], ...patch };
      return { ...prev, days: next };
    });
  };

  const updateLocation = (dayIndex: number, locIndex: number, patch: Partial<BuilderLocation>) => {
    setBuilder((prev) => {
      const days = [...prev.days];
      const locationsForDay = [...days[dayIndex].locations];
      locationsForDay[locIndex] = { ...locationsForDay[locIndex], ...patch };
      days[dayIndex] = { ...days[dayIndex], locations: locationsForDay };
      return { ...prev, days };
    });
  };

  const updateEvent = (
    dayIndex: number,
    locIndex: number,
    eventIndex: number,
    patch: Partial<BuilderEvent>
  ) => {
    setBuilder((prev) => {
      const days = [...prev.days];
      const locationsForDay = [...days[dayIndex].locations];
      const events = [...locationsForDay[locIndex].events];
      events[eventIndex] = { ...events[eventIndex], ...patch };
      locationsForDay[locIndex] = { ...locationsForDay[locIndex], events };
      days[dayIndex] = { ...days[dayIndex], locations: locationsForDay };
      return { ...prev, days };
    });
  };

  const addLocation = (dayIndex: number) => {
    setBuilder((prev) => {
      const days = [...prev.days];
      const locationsForDay = [...days[dayIndex].locations];
      locationsForDay.push({ locationId: locations[0]?._id || null, events: [] });
      days[dayIndex] = { ...days[dayIndex], locations: locationsForDay };
      return { ...prev, days };
    });
  };

  const removeLocation = (dayIndex: number, locIndex: number) => {
    setBuilder((prev) => {
      const days = [...prev.days];
      const locationsForDay = [...days[dayIndex].locations];
      locationsForDay.splice(locIndex, 1);
      days[dayIndex] = { ...days[dayIndex], locations: locationsForDay };
      return { ...prev, days };
    });
  };

  const addEvent = (dayIndex: number, locIndex: number) => {
    setBuilder((prev) => {
      const days = [...prev.days];
      const locationsForDay = [...days[dayIndex].locations];
      const events = [...locationsForDay[locIndex].events];
      events.push({ type: "holy-mass", time: "", intention: "", info: "" });
      locationsForDay[locIndex] = { ...locationsForDay[locIndex], events };
      days[dayIndex] = { ...days[dayIndex], locations: locationsForDay };
      return { ...prev, days };
    });
  };

  const removeEvent = (dayIndex: number, locIndex: number, eventIndex: number) => {
    setBuilder((prev) => {
      const days = [...prev.days];
      const locationsForDay = [...days[dayIndex].locations];
      const events = [...locationsForDay[locIndex].events];
      events.splice(eventIndex, 1);
      locationsForDay[locIndex] = { ...locationsForDay[locIndex], events };
      days[dayIndex] = { ...days[dayIndex], locations: locationsForDay };
      return { ...prev, days };
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fdfaf5_40%,_#f7f4ee_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6">
          <AppHeader
            locale={locale}
            onLocaleChange={setLocale}
            title={selectedParish?.name || t(locale, "weeklySchedule", "Schedule")}
            workspace={
              parishes.length > 1
                ? {
                    label: t(locale, "parishLabel", "Parish"),
                    value: selectedParishId,
                    options: parishes.map((parish) => ({ value: parish._id, label: parish.name })),
                    onChange: handleParishChange
                  }
                : undefined
            }
          />

          <div className="rounded-[28px] border border-neutral-200 bg-white/80 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                  {t(locale, "weekLabel", "Week")}
                </label>
                <input
                  type="date"
                  value={weekDate}
                  onChange={(event) => setWeekDate(event.target.value)}
                  className="rounded-full border border-neutral-200 px-3 py-2 text-sm"
                />
              <IconButton
                label={loadingWeek ? t(locale, "loading", "Loading...") : t(locale, "load", "Load")}
                onClick={() => loadWeek(weekDate)}
                disabled={loadingWeek}
                variant="primary"
              >
                <IconRefresh className="h-4 w-4" />
              </IconButton>
                {weekData?.week.label ? (
                  <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                    {weekData.week.label}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
              <IconButton label={t(locale, "prevWeek", "Prev week")} onClick={() => shiftWeek(-7)}>
                <IconChevronLeft className="h-4 w-4" />
              </IconButton>
              <IconButton label={t(locale, "nextWeek", "Next week")} onClick={() => shiftWeek(7)}>
                <IconChevronRight className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={t(locale, "editSchedule", "Edit schedule")}
                onClick={() => setEditorOpen(true)}
                variant="primary"
              >
                <IconPencil className="h-4 w-4" />
              </IconButton>
              </div>
            </div>
          </div>

          {message ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                message.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : message.type === "info"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {message.text}
            </div>
          ) : null}
        </header>

        <section className="grid gap-6">
          {weekData?.schedule.map((day) => (
            <article
              key={day.date}
              className="rounded-[28px] border border-neutral-200 bg-white/90 p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900">{day.day}</h2>
                  <p className="text-sm text-neutral-500">{day.date}</p>
                </div>
                {day.info ? (
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                    {day.info}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4">
                {day.locations.length === 0 ? (
                  <p className="text-sm text-neutral-500">{t(locale, "noEvents", "No events planned.")}</p>
                ) : (
                  day.locations.map((location) => (
                    <div key={location.id} className="rounded-2xl bg-neutral-50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-800">{location.name}</h3>
                        <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                          {location.slug}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {location.events.map((event, index) => (
                          <li
                            key={`${location.id}-${index}`}
                            className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                          >
                            <span className="font-semibold text-neutral-900">{event.time}</span>
                            <span className="rounded-full bg-neutral-900 px-2 py-1 text-xs uppercase tracking-wide text-white">
                              {eventTypeLabel(event.type)}
                            </span>
                            {event.intention ? (
                              <span className="text-neutral-600">{event.intention}</span>
                            ) : null}
                            {event.info ? (
                              <span className="text-neutral-400">{event.info}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>

        {editorOpen ? (
          <section className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/50 px-6 py-10">
            <div className="mx-auto w-full max-w-6xl rounded-[32px] bg-white p-8 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
                <div>
                  <h2 className="text-2xl font-semibold">{t(locale, "scheduleEditor", "Schedule editor")}</h2>
                  <p className="text-sm text-neutral-500">
                    {t(locale, "scheduleEditorSubtitle", "Build days, locations, and events for the week.")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={resetBuilder}
                    className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600"
                  >
                    {t(locale, "reset", "Reset")}
                  </button>
                  <button
                    onClick={saveSchedule}
                    className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white"
                  >
                    {t(locale, "save", "Save")}
                  </button>
                  <button
                    onClick={() => setEditorOpen(false)}
                    className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600"
                  >
                    {t(locale, "close", "Close")}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                      {t(locale, "weekLabelInput", "Week label")}
                    </label>
                    <input
                      value={builder.weekLabel}
                      onChange={(event) =>
                        setBuilder((prev) => ({ ...prev, weekLabel: event.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                    />
                  </div>

                  {builder.days.map((day, dayIndex) => (
                    <div key={day.dayName} className="rounded-[24px] border border-neutral-200 p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-neutral-900">{day.dayName}</h3>
                        <input
                          type="date"
                          value={day.date}
                          onChange={(event) => updateDay(dayIndex, { date: event.target.value })}
                          className="rounded-full border border-neutral-200 px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={day.info}
                          onChange={(event) => updateDay(dayIndex, { info: event.target.value })}
                          placeholder={t(locale, "infoPlaceholder", "Info")}
                          className="flex-1 rounded-full border border-neutral-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="mt-4 space-y-3">
                        {day.locations.map((location, locIndex) => (
                          <div key={`${day.dayName}-${locIndex}`} className="rounded-2xl bg-neutral-50 p-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <select
                                value={location.locationId || ""}
                                onChange={(event) =>
                                  updateLocation(dayIndex, locIndex, {
                                    locationId: event.target.value || null
                                  })
                                }
                                className="rounded-full border border-neutral-200 px-3 py-2 text-sm"
                              >
                                <option value="">{t(locale, "locationSelectPlaceholder", "Select location")}</option>
                                {locations.map((loc) => (
                                  <option key={loc._id} value={loc._id}>
                                    {loc.name}
                                  </option>
                                ))}
                              </select>
                              <IconButton
                                label={t(locale, "remove", "Remove")}
                                onClick={() => removeLocation(dayIndex, locIndex)}
                                variant="ghost"
                                size="sm"
                              >
                                <IconTrash className="h-4 w-4" />
                              </IconButton>
                            </div>
                            <div className="mt-3 space-y-3">
                              {location.events.map((event, eventIndex) => (
                                <div
                                  key={`${day.dayName}-${locIndex}-${eventIndex}`}
                                  className="flex flex-wrap items-center gap-3"
                                >
                                  <select
                                    value={event.type}
                                    onChange={(e) =>
                                      updateEvent(dayIndex, locIndex, eventIndex, { type: e.target.value })
                                    }
                                    className="rounded-full border border-neutral-200 px-3 py-2 text-sm"
                                  >
                                    {EVENT_TYPES.map((type) => (
                                      <option key={type.value} value={type.value}>
                                        {t(locale, type.key, type.value)}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={event.time}
                                    onChange={(e) =>
                                      updateEvent(dayIndex, locIndex, eventIndex, { time: e.target.value })
                                    }
                                    placeholder={t(locale, "timePlaceholder", "Time")}
                                    className="w-24 rounded-full border border-neutral-200 px-3 py-2 text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={event.intention}
                                    onChange={(e) =>
                                      updateEvent(dayIndex, locIndex, eventIndex, {
                                        intention: e.target.value
                                      })
                                    }
                                    placeholder={t(locale, "intentionPlaceholder", "Intention")}
                                    className="flex-1 rounded-full border border-neutral-200 px-3 py-2 text-sm"
                                  />
                                  <input
                                    type="text"
                                    value={event.info}
                                    onChange={(e) =>
                                      updateEvent(dayIndex, locIndex, eventIndex, { info: e.target.value })
                                    }
                                    placeholder={t(locale, "eventInfoPlaceholder", "Additional info")}
                                    className="flex-1 rounded-full border border-neutral-200 px-3 py-2 text-sm"
                                  />
                                  <IconButton
                                    label={t(locale, "remove", "Remove")}
                                    onClick={() => removeEvent(dayIndex, locIndex, eventIndex)}
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </IconButton>
                                </div>
                              ))}
                              <button
                                onClick={() => addEvent(dayIndex, locIndex)}
                                className="rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500"
                              >
                                {t(locale, "addEvent", "Add event")}
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => addLocation(dayIndex)}
                          className="rounded-full border border-dashed border-neutral-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500"
                        >
                          {t(locale, "addLocation", "Add location")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {t(locale, "jsonImportExport", "JSON import/export")}
                      </h3>
                      <button
                        onClick={copyJson}
                        className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold uppercase"
                      >
                        {t(locale, "copy", "Copy")}
                      </button>
                    </div>
                    <textarea
                      value={jsonText}
                      onChange={(event) => setJsonText(event.target.value)}
                      rows={20}
                      className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs"
                    />
                    <button
                      onClick={applyJson}
                      className="mt-3 w-full rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                    >
                      {t(locale, "loadJson", "Load JSON")}
                    </button>
                  </div>
                  <div className="rounded-[24px] border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
                    <h4 className="text-base font-semibold text-neutral-900">
                      {t(locale, "apiShortcuts", "API shortcuts")}
                    </h4>
                    <ul className="mt-2 space-y-1">
                      <li>POST /api/schedules</li>
                      <li>GET /api/weeks?date=YYYY-MM-DD&amp;parish=slug</li>
                      <li>GET /api/days?date=YYYY-MM-DD&amp;parish=slug</li>
                      <li>GET /api/location-schedules/slug?date=YYYY-MM-DD&amp;parish=slug</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
