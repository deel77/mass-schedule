import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convexMutation, convexQuery } from "@/lib/convexClient";

export type AuthContext =
  | { type: "user"; userId: string; isSuperadmin: boolean }
  | { type: "token"; token: any }
  | null;

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const session = await getServerSession(authOptions);
  if (session?.user && (session.user as any).id) {
    return {
      type: "user",
      userId: (session.user as any).id,
      isSuperadmin: Boolean((session.user as any).isSuperadmin)
    };
  }

  const header = request.headers.get("authorization") || "";
  const tokenValue = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null;
  if (!tokenValue) {
    return null;
  }

  const tokenHash = hashToken(tokenValue);
  const token = await convexQuery("tokens:getByHash", { tokenHash });
  if (!token || !(token as any).isActive) {
    return null;
  }

  await convexMutation("tokens:touchToken", { tokenId: (token as any)._id });
  return { type: "token", token };
}

export function requireScope(context: AuthContext, scope: string) {
  if (!context) {
    return false;
  }
  if (context.type === "user") {
    return true;
  }
  return Array.isArray(context.token.scopes) && context.token.scopes.includes(scope);
}

export function requireParishAccess(context: AuthContext, parishId: string) {
  if (!context) {
    return false;
  }
  if (context.type === "user") {
    return true;
  }
  return Array.isArray(context.token.parishIds) && context.token.parishIds.includes(parishId);
}
