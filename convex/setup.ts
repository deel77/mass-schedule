import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const bootstrap = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string()
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").first();
    if (existing) {
      throw new Error("Setup already completed");
    }
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      passwordHash: args.passwordHash,
      isSuperadmin: true,
      createdAt: Date.now()
    });
    return userId;
  }
});
