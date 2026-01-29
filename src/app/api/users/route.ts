import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { getAuthContext } from "@/lib/apiAuth";
import { convexMutation, convexQuery } from "@/lib/convexClient";

export async function GET(request: Request) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const users = await convexQuery("users:listUsers", { actorId: context.userId });
  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  try {
    const generatedPassword = body.password || crypto.randomBytes(9).toString("base64url");
    const passwordHash = await hash(generatedPassword, 10);
    const userId = await convexMutation("users:createUser", {
      actorId: context.userId,
      name: body.name,
      email: body.email,
      passwordHash,
      isSuperadmin: Boolean(body.isSuperadmin),
      parishIds: body.parishIds || []
    });
    return NextResponse.json({ userId, generatedPassword: body.password ? null : generatedPassword }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 422 });
  }
}
