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
    await convexMutation("tokens:updateToken", {
      actorId: context.userId,
      tokenId: params.id,
      name: body.name,
      scopes: body.scopes || [],
      parishIds: body.parishIds || [],
      isActive: Boolean(body.isActive)
    });
    return NextResponse.json({ tokenId: params.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
