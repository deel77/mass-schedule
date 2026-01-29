import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { assertParishAccess } from "./lib/access";
import { EVENT_TYPES } from "./lib/constants";
import { addDays, endOfWeek, formatIsoDate, parseIsoDate, startOfWeek } from "./lib/dates";

function normalizeDateString(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const compact = trimmed.replace(/\s+/g, "");
  const match = compact.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    return `${match[3]}-${month}-${day}`;
  }
  return formatIsoDate(parseIsoDate(trimmed));
}

function eventSortKey(time: string): string {
  const match = time.trim().match(/^([0-2]?\d):(\d{2})$/);
  if (match) {
    return match[1].padStart(2, "0") + ":" + match[2];
  }
  return `99:${time.toLowerCase()}`;
}

async function resolveLocation(ctx: any, parishId: string, entry: any) {
  if (entry.locationId) {
    const location = await ctx.db.get(entry.locationId);
    if (location && location.parishId === parishId) {
      return location;
    }
  }

  if (entry.locationSlug) {
    const location = await ctx.db
      .query("locations")
      .withIndex("by_slug", (q: any) => q.eq("parishId", parishId).eq("slug", entry.locationSlug))
      .unique();
    if (location) {
      return location;
    }
  }

  if (entry.locationName) {
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_parish", (q: any) => q.eq("parishId", parishId))
      .collect();
    const match = locations.find(
      (loc: any) => loc.name.toLowerCase() === entry.locationName.toLowerCase()
    );
    if (match) {
      return match;
    }
  }

  return null;
}

async function formatWeek(ctx: any, parishId: string, date: string, onlyLocationId?: string) {
  const baseDate = parseIsoDate(normalizeDateString(date));
  const start = startOfWeek(baseDate);
  const end = endOfWeek(start);
  const startDate = formatIsoDate(start);
  const endDate = formatIsoDate(end);

  const weekLabel = await ctx.db
    .query("weekLabels")
    .withIndex("by_parish_start", (q: any) => q.eq("parishId", parishId).eq("startDate", startDate))
    .unique();

  const days = await ctx.db
    .query("days")
    .withIndex("by_parish_date", (q: any) =>
      q.eq("parishId", parishId).gte("date", startDate).lte("date", endDate)
    )
    .collect();

  const locations = await ctx.db
    .query("locations")
    .withIndex("by_parish", (q: any) => q.eq("parishId", parishId))
    .collect();
  const locationMap = new Map<string, any>(locations.map((loc: any) => [loc._id, loc]));

  const schedule = [] as any[];
  const sortedDays = days.sort((a: any, b: any) => a.date.localeCompare(b.date));
  for (const day of sortedDays) {
    const events = await ctx.db
      .query("events")
      .withIndex("by_day", (q: any) => q.eq("dayId", day._id))
      .collect();

    const grouped = new Map<string, any>();
    for (const event of events) {
      if (onlyLocationId && event.locationId !== onlyLocationId) {
        continue;
      }
      const location = locationMap.get(event.locationId);
      if (!location) {
        continue;
      }
      if (!grouped.has(location._id)) {
        grouped.set(location._id, { location, events: [] as any[] });
      }
      grouped.get(location._id).events.push(event);
    }

    const locationsPayload = Array.from(grouped.values())
      .sort((a, b) => {
        if (a.location.displayOrder !== b.location.displayOrder) {
          return a.location.displayOrder - b.location.displayOrder;
        }
        return a.location.name.localeCompare(b.location.name);
      })
      .map((group) => ({
        id: group.location._id,
        name: group.location.name,
        slug: group.location.slug,
        events: group.events
          .sort((a, b) => eventSortKey(a.timeText).localeCompare(eventSortKey(b.timeText)))
          .map((event: any) => ({
            type: event.eventType,
            time: event.timeText,
            intention: event.intention ?? null,
            info: event.info ?? null
          }))
      }));

    if (onlyLocationId && locationsPayload.length === 0) {
      continue;
    }

    schedule.push({
      day: day.dayName,
      date: day.date,
      info: day.info ?? null,
      locations: locationsPayload
    });
  }

  return {
    week: {
      start_date: startDate,
      end_date: endDate,
      label: weekLabel?.label ?? null
    },
    schedule
  };
}

export const getWeekView = query({
  args: { parishId: v.id("parishes"), date: v.string() },
  handler: async (ctx, args) => {
    const parish = await ctx.db.get(args.parishId);
    if (!parish) {
      throw new Error("Parish not found");
    }
    return {
      parish: { id: parish._id, name: parish.name, slug: parish.slug },
      ...(await formatWeek(ctx, args.parishId, args.date))
    };
  }
});

export const getDayView = query({
  args: { parishId: v.id("parishes"), date: v.string() },
  handler: async (ctx, args) => {
    const normalized = normalizeDateString(args.date);
    const day = await ctx.db
      .query("days")
      .withIndex("by_parish_date", (q) => q.eq("parishId", args.parishId).eq("date", normalized))
      .unique();
    if (!day) {
      return null;
    }

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_parish", (q: any) => q.eq("parishId", args.parishId))
      .collect();
    const locationMap = new Map<string, any>(locations.map((loc: any) => [loc._id, loc]));

    const events = await ctx.db
      .query("events")
      .withIndex("by_day", (q: any) => q.eq("dayId", day._id))
      .collect();

    const grouped = new Map<string, any>();
    for (const event of events) {
      const location = locationMap.get(event.locationId);
      if (!location) {
        continue;
      }
      if (!grouped.has(location._id)) {
        grouped.set(location._id, { location, events: [] as any[] });
      }
      grouped.get(location._id).events.push(event);
    }

    const locationsPayload = Array.from(grouped.values())
      .sort((a, b) => {
        if (a.location.displayOrder !== b.location.displayOrder) {
          return a.location.displayOrder - b.location.displayOrder;
        }
        return a.location.name.localeCompare(b.location.name);
      })
      .map((group) => ({
        id: group.location._id,
        name: group.location.name,
        slug: group.location.slug,
        events: group.events
          .sort((a, b) => eventSortKey(a.timeText).localeCompare(eventSortKey(b.timeText)))
          .map((event: any) => ({
            type: event.eventType,
            time: event.timeText,
            intention: event.intention ?? null,
            info: event.info ?? null
          }))
      }));

    return {
      day: day.dayName,
      date: day.date,
      info: day.info ?? null,
      locations: locationsPayload
    };
  }
});

export const getLocationWeekView = query({
  args: { parishId: v.id("parishes"), date: v.string(), locationSlugOrName: v.string() },
  handler: async (ctx, args) => {
    const parish = await ctx.db.get(args.parishId);
    if (!parish) {
      throw new Error("Parish not found");
    }

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_parish", (q: any) => q.eq("parishId", args.parishId))
      .collect();
    const target = locations.find(
      (loc) =>
        loc.slug === args.locationSlugOrName ||
        loc.name.toLowerCase() === args.locationSlugOrName.toLowerCase()
    );
    if (!target) {
      return null;
    }

    const data = await formatWeek(ctx, args.parishId, args.date, target._id);
    return {
      parish: { id: parish._id, name: parish.name, slug: parish.slug },
      location: {
        id: target._id,
        name: target.name,
        slug: target.slug,
        description: target.description ?? null
      },
      ...data
    };
  }
});

export const importWeek = mutation({
  args: {
    actorId: v.id("users"),
    parishId: v.id("parishes"),
    weekLabel: v.optional(v.string()),
    days: v.array(
      v.object({
        date: v.string(),
        dayName: v.string(),
        info: v.optional(v.string()),
        locations: v.array(
          v.object({
            locationId: v.optional(v.id("locations")),
            locationSlug: v.optional(v.string()),
            locationName: v.optional(v.string()),
            events: v.array(
              v.object({
                type: v.string(),
                time: v.string(),
                intention: v.optional(v.string()),
                info: v.optional(v.string())
              })
            )
          })
        )
      })
    )
  },
  handler: async (ctx, args) => {
    await assertParishAccess(ctx, args.actorId, args.parishId);

    if (args.days.length === 0) {
      throw new Error("Schedule must contain at least one day");
    }

    const normalizedDates = args.days.map((day) => normalizeDateString(day.date));
    const earliest = normalizedDates.sort()[0];
    const weekStartDate = startOfWeek(parseIsoDate(earliest));
    const weekEndDate = endOfWeek(weekStartDate);
    const weekStartIso = formatIsoDate(weekStartDate);
    const weekEndIso = formatIsoDate(weekEndDate);

    let weekLabel = await ctx.db
      .query("weekLabels")
      .withIndex("by_parish_start", (q) => q.eq("parishId", args.parishId).eq("startDate", weekStartIso))
      .unique();

    if (!weekLabel) {
      const labelId = await ctx.db.insert("weekLabels", {
        parishId: args.parishId,
        startDate: weekStartIso,
        endDate: weekEndIso,
        label: args.weekLabel?.trim() || undefined,
        createdAt: Date.now()
      });
      weekLabel = await ctx.db.get(labelId);
    } else if (args.weekLabel !== undefined) {
      await ctx.db.patch(weekLabel._id, {
        label: args.weekLabel?.trim() || undefined,
        endDate: weekEndIso
      });
    }

    const keepDates = new Set(normalizedDates);
    const existingDays = await ctx.db
      .query("days")
      .withIndex("by_parish_date", (q) =>
        q.eq("parishId", args.parishId).gte("date", weekStartIso).lte("date", weekEndIso)
      )
      .collect();

    for (const day of existingDays) {
      if (!keepDates.has(day.date)) {
        const existingEvents = await ctx.db
          .query("events")
          .withIndex("by_day", (q: any) => q.eq("dayId", day._id))
          .collect();
        for (const event of existingEvents) {
          await ctx.db.delete(event._id);
        }
        await ctx.db.delete(day._id);
      }
    }

    const locationOrderMap = new Map<string, number>();

    for (const dayPayload of args.days) {
      const dateIso = normalizeDateString(dayPayload.date);

      let day = await ctx.db
        .query("days")
        .withIndex("by_parish_date", (q) => q.eq("parishId", args.parishId).eq("date", dateIso))
        .unique();

      if (!day) {
        const dayId = await ctx.db.insert("days", {
          parishId: args.parishId,
          date: dateIso,
          dayName: dayPayload.dayName,
          info: dayPayload.info?.trim() || undefined,
          weekLabelId: weekLabel?._id,
          createdAt: Date.now()
        });
        day = await ctx.db.get(dayId);
      } else {
        await ctx.db.patch(day._id, {
          dayName: dayPayload.dayName,
          info: dayPayload.info?.trim() || undefined,
          weekLabelId: weekLabel?._id
        });
      }

      const existingEvents = await ctx.db
        .query("events")
        .withIndex("by_day", (q: any) => q.eq("dayId", day._id))
        .collect();
      for (const event of existingEvents) {
        await ctx.db.delete(event._id);
      }

      for (let index = 0; index < dayPayload.locations.length; index += 1) {
        const locationPayload = dayPayload.locations[index];
        const location = await resolveLocation(ctx, args.parishId, locationPayload);
        if (!location) {
          throw new Error("Location not found in parish");
        }
        const currentOrder = locationOrderMap.get(location._id);
        if (currentOrder === undefined || index < currentOrder) {
          locationOrderMap.set(location._id, index);
        }

        for (const eventPayload of locationPayload.events) {
          if (!EVENT_TYPES.includes(eventPayload.type as any)) {
            throw new Error("Invalid event type");
          }
          if (!eventPayload.time || !eventPayload.type) {
            throw new Error("Event time and type are required");
          }

          await ctx.db.insert("events", {
            dayId: day._id,
            locationId: location._id,
            eventType: eventPayload.type,
            timeText: eventPayload.time,
            intention: eventPayload.intention?.trim() || undefined,
            info: eventPayload.info?.trim() || undefined,
            createdAt: Date.now()
          });
        }
      }
    }

    for (const [locationId, order] of locationOrderMap.entries()) {
      await ctx.db.patch(locationId, { displayOrder: order });
    }

    return {
      week: {
        start_date: weekStartIso,
        end_date: weekEndIso,
        label: weekLabel?.label ?? null
      }
    };
  }
});
