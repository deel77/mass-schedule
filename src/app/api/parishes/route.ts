import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/apiAuth";
import { convexMutation, convexQuery } from "@/lib/convexClient";

export async function GET(request: Request) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const parishes = await convexQuery("parishes:listForUser", { actorId: context.userId });
  return NextResponse.json({ parishes });
}

export async function POST(request: Request) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  try {
    const parishId = await convexMutation("parishes:create", {
      actorId: context.userId,
      name: body.name,
      slug: body.slug,
      description: body.description
    });
    return NextResponse.json({ parishId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
