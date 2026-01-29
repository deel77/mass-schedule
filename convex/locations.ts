import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { assertSuperadmin } from "./lib/permissions";
import { slugify } from "./lib/slugs";

export const listByParish = query({
  args: { parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();
    return locations.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }
});

export const getBySlug = query({
  args: { parishId: v.id("parishes"), slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("locations")
      .withIndex("by_slug", (q) => q.eq("parishId", args.parishId).eq("slug", args.slug))
      .unique();
  }
});

export const create = mutation({
  args: {
    actorId: v.id("users"),
    parishId: v.id("parishes"),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);

    const slug = args.slug && args.slug.trim() ? args.slug.trim() : slugify(args.name);
    const existingSlug = await ctx.db
      .query("locations")
      .withIndex("by_slug", (q) => q.eq("parishId", args.parishId).eq("slug", slug))
      .unique();
    if (existingSlug) {
      throw new Error("Location slug already exists");
    }

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();
    const nextOrder =
      typeof args.displayOrder === "number"
        ? args.displayOrder
        : locations.reduce((max, loc) => Math.max(max, loc.displayOrder), -1) + 1;

    return ctx.db.insert("locations", {
      parishId: args.parishId,
      name: args.name,
      slug,
      description: args.description?.trim() || undefined,
      displayOrder: nextOrder,
      createdAt: Date.now()
    });
  }
});

export const update = mutation({
  args: {
    actorId: v.id("users"),
    locationId: v.id("locations"),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number()
  },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    const slug = args.slug && args.slug.trim() ? args.slug.trim() : slugify(args.name);
    const existingSlug = await ctx.db
      .query("locations")
      .withIndex("by_slug", (q) => q.eq("parishId", location.parishId).eq("slug", slug))
      .unique();
    if (existingSlug && existingSlug._id !== args.locationId) {
      throw new Error("Location slug already exists");
    }

    await ctx.db.patch(args.locationId, {
      name: args.name,
      slug,
      description: args.description?.trim() || undefined,
      displayOrder: args.displayOrder
    });
    return args.locationId;
  }
});

export const remove = mutation({
  args: { actorId: v.id("users"), locationId: v.id("locations") },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);
    const events = await ctx.db
      .query("events")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .collect();
    if (events.length > 0) {
      throw new Error("Cannot delete location with events");
    }
    await ctx.db.delete(args.locationId);
    return args.locationId;
  }
});
