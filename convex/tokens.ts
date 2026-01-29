import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperadmin } from "./lib/permissions";

export const listTokens = query({
  args: { actorId: v.id("users") },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);
    return ctx.db.query("apiTokens").collect();
  }
});

export const getByHash = query({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("apiTokens")
      .withIndex("by_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
  }
});

export const createToken = mutation({
  args: {
    actorId: v.id("users"),
    name: v.string(),
    tokenHash: v.string(),
    tokenPrefix: v.string(),
    scopes: v.array(v.string()),
    parishIds: v.array(v.id("parishes"))
  },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);

    return ctx.db.insert("apiTokens", {
      name: args.name,
      tokenHash: args.tokenHash,
      tokenPrefix: args.tokenPrefix,
      scopes: args.scopes,
      parishIds: args.parishIds,
      isActive: true,
      createdBy: args.actorId,
      createdAt: Date.now()
    });
  }
});

export const updateToken = mutation({
  args: {
    actorId: v.id("users"),
    tokenId: v.id("apiTokens"),
    name: v.string(),
    scopes: v.array(v.string()),
    parishIds: v.array(v.id("parishes")),
    isActive: v.boolean()
  },
  handler: async (ctx, args) => {
    await assertSuperadmin(ctx, args.actorId);
    await ctx.db.patch(args.tokenId, {
      name: args.name,
      scopes: args.scopes,
      parishIds: args.parishIds,
      isActive: args.isActive
    });
    return args.tokenId;
  }
});

export const touchToken = mutation({
  args: { tokenId: v.id("apiTokens") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, { lastUsedAt: Date.now() });
    return args.tokenId;
  }
});
