import crypto from "crypto";
import { NextResponse } from "next/server";
import { getAuthContext, hashToken } from "@/lib/apiAuth";
import { convexMutation, convexQuery } from "@/lib/convexClient";

function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function GET(request: Request) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const tokens = await convexQuery("tokens:listTokens", { actorId: context.userId });
  return NextResponse.json({ tokens });
}

export async function POST(request: Request) {
  const context = await getAuthContext(request);
  if (!context || context.type !== "user" || !context.isSuperadmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const tokenPrefix = rawToken.slice(0, 6);

  const tokenId = await convexMutation("tokens:createToken", {
    actorId: context.userId,
    name: body.name,
    tokenHash,
    tokenPrefix,
    scopes: body.scopes || [],
    parishIds: body.parishIds || []
  });

  return NextResponse.json({ tokenId, token: rawToken }, { status: 201 });
}
