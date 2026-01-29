import { NextResponse } from "next/server";
import { getAuthContext, requireParishAccess, requireScope } from "@/lib/apiAuth";
import { convexQuery } from "@/lib/convexClient";
import { resolveParishId } from "@/lib/resolveParish";

export async function GET(request: Request) {
  const context = await getAuthContext(request);
  if (!context) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (context.type === "token" && !requireScope(context, "read:weeks")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parishParam = searchParams.get("parish");
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const parishId = await resolveParishId(context, parishParam);
  if (!parishId) {
    return NextResponse.json({ message: "Parish not found" }, { status: 404 });
  }
  if (context.type === "token" && !requireParishAccess(context, parishId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await convexQuery("schedules:getWeekView", { parishId, date });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
}
