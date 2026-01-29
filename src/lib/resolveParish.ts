import { convexQuery } from "@/lib/convexClient";
import { AuthContext } from "@/lib/apiAuth";

export async function resolveParishId(
  context: AuthContext,
  parishSelector: string | null
): Promise<string | null> {
  if (parishSelector) {
    const bySlug = await convexQuery("parishes:getBySlug", { slug: parishSelector });
    if (bySlug) {
      return (bySlug as any)._id;
    }
    return parishSelector;
  }

  if (!context) {
    return null;
  }

  if (context.type === "token") {
    return Array.isArray(context.token.parishIds) && context.token.parishIds.length > 0
      ? context.token.parishIds[0]
      : null;
  }

  const parishes = await convexQuery("parishes:listForUser", { actorId: context.userId });
  const sorted = (parishes as any[]).sort((a, b) => a.name.localeCompare(b.name));
  return sorted[0]?._id || null;
}
