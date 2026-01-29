import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/apiAuth";
import { convexMutation } from "@/lib/convexClient";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authContext = await getAuthContext(request);
  if (!authContext || authContext.type !== "user" || !authContext.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  try {
    await convexMutation("locations:update", {
      actorId: authContext.userId,
      locationId: id,
      name: body.name,
      slug: body.slug,
      description: body.description,
      displayOrder: body.displayOrder
    });
    return NextResponse.json({ locationId: id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const authContext = await getAuthContext(request);
  if (!authContext || authContext.type !== "user" || !authContext.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    await convexMutation("locations:remove", {
      actorId: authContext.userId,
      locationId: id
    });
    return NextResponse.json({ locationId: id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
