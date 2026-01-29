import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/apiAuth";
import { convexMutation, convexQuery } from "@/lib/convexClient";
import { resolveParishId } from "@/lib/resolveParish";

function normalizePayload(body: any) {
  if (Array.isArray(body.days)) {
    return body;
  }
  if (Array.isArray(body.schedule)) {
    return {
      weekLabel: body.season,
      days: body.schedule.map((day: any) => ({
        date: day.date,
        dayName: day.day,
        info: day.info,
        locations: (day.locations || []).map((location: any) => ({
          locationName: location.name,
          events: location.events || []
        }))
      }))
    };
  }
  return body;
}

export async function POST(request: Request) {
  const context = await getAuthContext(request);
  if (!context) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (context.type !== "user") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = normalizePayload(await request.json());
  const { searchParams } = new URL(request.url);
  const parishParam = body.parish || searchParams.get("parish");
  const parishId = await resolveParishId(context, parishParam || null);
  if (!parishId) {
    return NextResponse.json({ message: "Parish not found" }, { status: 404 });
  }
  try {
    const result = await convexMutation("schedules:importWeek", {
      actorId: context.userId,
      parishId,
      weekLabel: body.weekLabel,
      days: body.days || []
    });

    const data = await convexQuery("schedules:getWeekView", {
      parishId,
      date: result.week.start_date
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
