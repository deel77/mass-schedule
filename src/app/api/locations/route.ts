import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/apiAuth";
import { convexMutation, convexQuery } from "@/lib/convexClient";

export async function GET(request: Request) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const parishId = searchParams.get("parishId");
  if (!parishId) {
    return NextResponse.json({ message: "Missing parishId" }, { status: 400 });
  }
  const locations = await convexQuery("locations:listByParish", { parishId });
  return NextResponse.json({ locations });
}

export async function POST(request: Request) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  try {
    const locationId = await convexMutation("locations:create", {
      actorId: context.userId,
      parishId: body.parishId,
      name: body.name,
      slug: body.slug,
      description: body.description,
      displayOrder: body.displayOrder
    });
    return NextResponse.json({ locationId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
