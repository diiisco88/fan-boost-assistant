import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { SignJWT } from "jose";
import { getFanvueAuthUrl, generateCodeVerifier, generateCodeChallenge } from "@/lib/fanvue";

const STATE_COOKIE = "fba_oauth_state";
const VERIFIER_COOKIE = "fba_pkce_verifier";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function GET(): Promise<NextResponse> {
  const state = randomBytes(16).toString("hex");
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Sign the state so we can verify it on callback
  const signedState = await new SignJWT({ state })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecret());

  const authUrl = getFanvueAuthUrl(state, codeChallenge);

  const response = NextResponse.redirect(authUrl);

  response.cookies.set(STATE_COOKIE, signedState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  response.cookies.set(VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
