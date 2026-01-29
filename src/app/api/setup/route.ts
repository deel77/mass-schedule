import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { convexMutation } from "@/lib/convexClient";

export async function POST(request: Request) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Setup disabled" }, { status: 403 });
  }

  const body = await request.json();
  if (body.secret !== secret) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 403 });
  }

  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });
  }

  const passwordHash = await hash(body.password, 10);
  const userId = await convexMutation("setup:bootstrap", {
    name: body.name,
    email: body.email,
    passwordHash
  });

  return NextResponse.json({ userId }, { status: 201 });
}
