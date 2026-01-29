import { query } from "convex/server";
import { v } from "convex/values";

export async function assertSuperadmin(ctx: { db: any }, userId: string) {
  const user = await ctx.db.get(userId);
  if (!user || !user.isSuperadmin) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function assertUser(ctx: { db: any }, userId: string) {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export const getUserPermissions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    const parishLinks = await ctx.db
      .query("parishUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .collect();
    const parishIds = parishLinks.map((link: any) => link.parishId);
    return {
      user,
      parishIds
    };
  }
});
