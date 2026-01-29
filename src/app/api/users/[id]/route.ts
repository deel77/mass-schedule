import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getAuthContext } from "@/lib/apiAuth";
import { convexMutation } from "@/lib/convexClient";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  try {
    const passwordHash = body.password ? await hash(body.password, 10) : undefined;
    await convexMutation("users:updateUser", {
      actorId: context.userId,
      userId: params.id,
      name: body.name,
      email: body.email,
      isSuperadmin: Boolean(body.isSuperadmin),
      parishIds: body.parishIds || [],
      passwordHash
    });
    return NextResponse.json({ userId: params.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
