export async function assertParishAccess(ctx: { db: any }, userId: string, parishId: string) {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.isSuperadmin) {
    return user;
  }
  const link = await ctx.db
    .query("parishUsers")
    .withIndex("by_user_parish", (q: any) => q.eq("userId", userId).eq("parishId", parishId))
    .unique();
  if (!link) {
    throw new Error("Forbidden");
  }
  return user;
}
