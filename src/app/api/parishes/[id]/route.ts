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
    await convexMutation("parishes:update", {
      actorId: context.userId,
      parishId: params.id,
      name: body.name,
      slug: body.slug,
      description: body.description
    });
    return NextResponse.json({ parishId: params.id });
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
    await convexMutation("parishes:remove", {
      actorId: context.userId,
      parishId: params.id
    });
    return NextResponse.json({ parishId: params.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
