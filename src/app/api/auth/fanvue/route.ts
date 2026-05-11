import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { SignJWT } from "jose";
import { getFanvueAuthUrl } from "@/lib/fanvue";

const STATE_COOKIE = "fba_oauth_state";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function GET(): Promise<NextResponse> {
  const state = randomBytes(16).toString("hex");

  // Sign the state so we can verify it on callback
  const signedState = await new SignJWT({ state })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecret());

  const authUrl = getFanvueAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(STATE_COOKIE, signedState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
