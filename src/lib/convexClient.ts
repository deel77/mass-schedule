import { ConvexHttpClient } from "convex/browser";

function getConvexUrl() {
  return process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";
}

export function getConvexClient() {
  const url = getConvexUrl();
  if (!url) {
    throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url, { skipConvexDeploymentUrlCheck: true });
}

export async function convexQuery(name: string, args: Record<string, unknown>) {
  const client = getConvexClient();
  return client.query(name as any, args as any);
}

export async function convexMutation(name: string, args: Record<string, unknown>) {
  const client = getConvexClient();
  return client.mutation(name as any, args as any);
}
