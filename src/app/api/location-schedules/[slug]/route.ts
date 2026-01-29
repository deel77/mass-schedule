import { NextRequest, NextResponse } from "next/server";
import { getAuthContext, requireParishAccess, requireScope } from "@/lib/apiAuth";
import { convexQuery } from "@/lib/convexClient";
import { resolveParishId } from "@/lib/resolveParish";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const authContext = await getAuthContext(request);
  if (!authContext) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (authContext.type === "token" && !requireScope(authContext, "read:locations")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parishParam = searchParams.get("parish");
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const parishId = await resolveParishId(authContext, parishParam);
  if (!parishId) {
    return NextResponse.json({ message: "Parish not found" }, { status: 404 });
  }
  if (authContext.type === "token" && !requireParishAccess(authContext, parishId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await convexQuery("schedules:getLocationWeekView", {
    parishId,
    date,
    locationSlugOrName: slug
  });

  if (!data) {
    return NextResponse.json({ message: "Location not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
