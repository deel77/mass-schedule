import { NextResponse } from "next/server";
import { getAuthContext, requireParishAccess, requireScope } from "@/lib/apiAuth";
import { convexQuery } from "@/lib/convexClient";
import { resolveParishId } from "@/lib/resolveParish";

export async function GET(request: Request) {
  const context = await getAuthContext(request);
  if (!context) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (context.type === "token" && !requireScope(context, "read:days")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parishParam = searchParams.get("parish");
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json({ message: "Missing date" }, { status: 400 });
  }
  const parishId = await resolveParishId(context, parishParam);
  if (!parishId) {
    return NextResponse.json({ message: "Parish not found" }, { status: 404 });
  }
  if (context.type === "token" && !requireParishAccess(context, parishId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const day = await convexQuery("schedules:getDayView", { parishId, date });
  if (!day) {
    return NextResponse.json({ message: "Day not found" }, { status: 404 });
  }
  return NextResponse.json(day);
}
