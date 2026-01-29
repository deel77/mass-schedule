import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/apiAuth";
import { convexMutation } from "@/lib/convexClient";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  try {
    await convexMutation("locations:update", {
      actorId: context.userId,
      locationId: params.id,
      name: body.name,
      slug: body.slug,
      description: body.description,
      displayOrder: body.displayOrder
    });
    return NextResponse.json({ locationId: params.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    await convexMutation("locations:remove", {
      actorId: context.userId,
      locationId: params.id
    });
    return NextResponse.json({ locationId: params.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
