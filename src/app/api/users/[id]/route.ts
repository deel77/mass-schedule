import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
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
    const passwordHash = body.password ? await hash(body.password, 10) : undefined;
    await convexMutation("users:updateUser", {
      actorId: authContext.userId,
      userId: id,
      name: body.name,
      email: body.email,
      isSuperadmin: Boolean(body.isSuperadmin),
      parishIds: body.parishIds || [],
      passwordHash
    });
    return NextResponse.json({ userId: id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
