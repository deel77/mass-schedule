import { mutation, query } from "convex/server";
import { v } from "convex/values";
import { assertSuperadmin } from "./lib/permissions";
import { slugify } from "./lib/slugs";

export const listForUser = query({
  args: { actorId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.actorId);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.isSuperadmin) {
      return ctx.db.query("parishes").collect();
    }

    const links = await ctx.db
      .query("parishUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.actorId))
      .collect();

    const parishIds = links.map((link) => link.parishId);
    const parishes = [];
    for (const id of parishIds) {
      const parish = await ctx.db.get(id);
      if (parish) {
        parishes.push(parish);
      }
    }
    return parishes;
  }
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("parishes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  }
});

export const create = mutation({
  args: {
    actorId: v.id("users"),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);
    const slug = args.slug && args.slug.trim() ? args.slug.trim() : slugify(args.name);

    const existingName = await ctx.db
      .query("parishes")
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();
    if (existingName) {
      throw new Error("Parish name already exists");
    }

    const existingSlug = await ctx.db
      .query("parishes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingSlug) {
      throw new Error("Parish slug already exists");
    }

    return ctx.db.insert("parishes", {
      name: args.name,
      slug,
      description: args.description?.trim() || undefined,
      createdAt: Date.now()
    });
  }
});

export const update = mutation({
  args: {
    actorId: v.id("users"),
    parishId: v.id("parishes"),
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);
    const parish = await ctx.db.get(args.parishId);
    if (!parish) {
      throw new Error("Parish not found");
    }

    const slug = args.slug && args.slug.trim() ? args.slug.trim() : slugify(args.name);
    const existingSlug = await ctx.db
      .query("parishes")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existingSlug && existingSlug._id !== args.parishId) {
      throw new Error("Parish slug already exists");
    }

    await ctx.db.patch(args.parishId, {
      name: args.name,
      slug,
      description: args.description?.trim() || undefined
    });
    return args.parishId;
  }
});

export const remove = mutation({
  args: { actorId: v.id("users"), parishId: v.id("parishes") },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();
    if (locations.length > 0) {
      throw new Error("Cannot delete parish with locations");
    }

    const days = await ctx.db
      .query("days")
      .withIndex("by_parish_date", (q) => q.eq("parishId", args.parishId))
      .collect();
    if (days.length > 0) {
      throw new Error("Cannot delete parish with schedule data");
    }

    const links = await ctx.db
      .query("parishUsers")
      .withIndex("by_parish", (q) => q.eq("parishId", args.parishId))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    await ctx.db.delete(args.parishId);
    return args.parishId;
  }
});
