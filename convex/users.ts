import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperadmin } from "./lib/permissions";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  }
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  }
});

export const listUsers = query({
  args: { actorId: v.id("users") },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);
    const users = await ctx.db.query("users").collect();
    const parishLinks = await ctx.db.query("parishUsers").collect();
    const byUser = new Map<string, string[]>();

    for (const link of parishLinks) {
      const key = link.userId as string;
      if (!byUser.has(key)) {
        byUser.set(key, []);
      }
      byUser.get(key)!.push(link.parishId as string);
    }

    return users.map((user) => ({
      ...user,
      parishIds: byUser.get(user._id) || []
    }));
  }
});

export const createUser = mutation({
  args: {
    actorId: v.id("users"),
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    isSuperadmin: v.boolean(),
    parishIds: v.array(v.id("parishes"))
  },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) {
      throw new Error("Email already exists");
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      passwordHash: args.passwordHash,
      isSuperadmin: args.isSuperadmin,
      createdAt: Date.now()
    });

    for (const parishId of args.parishIds) {
      await ctx.db.insert("parishUsers", {
        userId,
        parishId,
        createdAt: Date.now()
      });
    }

    return userId;
  }
});

export const updateUser = mutation({
  args: {
    actorId: v.id("users"),
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    isSuperadmin: v.boolean(),
    parishIds: v.array(v.id("parishes")),
    passwordHash: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);

    const existing = await ctx.db.get(args.userId);
    if (!existing) {
      throw new Error("User not found");
    }

    const emailConflict = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (emailConflict && emailConflict._id !== args.userId) {
      throw new Error("Email already exists");
    }

    await ctx.db.patch(args.userId, {
      name: args.name,
      email: args.email,
      isSuperadmin: args.isSuperadmin,
      passwordHash: args.passwordHash ?? existing.passwordHash
    });

    const existingLinks = await ctx.db
      .query("parishUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const link of existingLinks) {
      await ctx.db.delete(link._id);
    }

    for (const parishId of args.parishIds) {
      await ctx.db.insert("parishUsers", {
        userId: args.userId,
        parishId,
        createdAt: Date.now()
      });
    }

    return args.userId;
  }
});
