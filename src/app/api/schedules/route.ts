import { NextResponse } from "next/server";
import { getAuthContext, requireParishAccess, requireScope } from "@/lib/apiAuth";
import { convexMutation, convexQuery } from "@/lib/convexClient";
import { resolveParishId } from "@/lib/resolveParish";

function normalizeEvent(event: any) {
  return {
    ...event,
    intention: event?.intention ?? undefined,
    info: event?.info ?? undefined
  };
}

function normalizeLocation(location: any) {
  return {
    ...location,
    events: (location?.events || []).map(normalizeEvent)
  };
}

function normalizePayload(body: any) {
  if (Array.isArray(body.days)) {
    return {
      ...body,
      days: body.days.map((day: any) => ({
        ...day,
        info: day?.info ?? undefined,
        locations: (day.locations || []).map((location: any) => ({
          ...location,
          events: (location.events || []).map(normalizeEvent)
        }))
      }))
    };
  }
  if (Array.isArray(body.schedule)) {
    return {
      weekLabel: body.season,
      days: body.schedule.map((day: any) => ({
        date: day.date,
        dayName: day.day,
        info: day?.info ?? undefined,
        locations: (day.locations || []).map((location: any) => ({
          locationName: location.name,
          events: (location.events || []).map(normalizeEvent)
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
  if (context.type === "token" && !requireScope(context, "write:schedules")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = normalizePayload(await request.json());
  const { searchParams } = new URL(request.url);
  const parishParam = body.parish || searchParams.get("parish");
  const parishId = await resolveParishId(context, parishParam || null);
  if (!parishId) {
    return NextResponse.json({ message: "Parish not found" }, { status: 404 });
  }
  if (!requireParishAccess(context, parishId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const result =
      context.type === "token"
        ? await convexMutation("schedules:importWeekWithToken", {
            parishId,
            weekLabel: body.weekLabel,
            days: body.days || []
          })
        : await convexMutation("schedules:importWeek", {
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
