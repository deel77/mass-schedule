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
    await convexMutation("tokens:updateToken", {
      actorId: authContext.userId,
      tokenId: id,
      name: body.name,
      scopes: body.scopes || [],
      parishIds: body.parishIds || [],
      isActive: Boolean(body.isActive)
    });
    return NextResponse.json({ tokenId: id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
