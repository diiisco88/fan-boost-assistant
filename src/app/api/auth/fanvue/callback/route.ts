import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { exchangeCode, getCreatorProfile } from "@/lib/fanvue";
import { encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const STATE_COOKIE = "fba_oauth_state";
const SESSION_COOKIE = "fba_session";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_params", request.url));
  }

  // Verify state cookie
  const signedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!signedState) {
    return NextResponse.redirect(new URL("/?error=missing_state", request.url));
  }

  try {
    const { payload } = await jwtVerify(signedState, getSecret());
    if (payload["state"] !== state) {
      return NextResponse.redirect(new URL("/?error=state_mismatch", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }

  // Exchange code for tokens
  let tokens: { access_token: string; refresh_token: string; expires_in: number };
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    console.error("Token exchange failed:", err);
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", request.url));
  }

  // Fetch creator profile
  let profile: { id: string; handle: string; displayName: string; avatarUrl: string };
  try {
    profile = await getCreatorProfile(tokens.access_token);
  } catch (err) {
    console.error("Profile fetch failed:", err);
    return NextResponse.redirect(new URL("/?error=profile_fetch_failed", request.url));
  }

  // Encrypt tokens
  const encryptedToken = await encryptToken(tokens.access_token);
  const encryptedRefresh = await encryptToken(tokens.refresh_token);
  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Upsert user + creator
  const user = await prisma.user.upsert({
    where: { email: `${profile.id}@fanvue.internal` },
    update: { name: profile.displayName, image: profile.avatarUrl },
    create: {
      email: `${profile.id}@fanvue.internal`,
      name: profile.displayName,
      image: profile.avatarUrl,
    },
  });

  const creator = await prisma.creator.upsert({
    where: { fanvueId: profile.id },
    update: {
      fanvueHandle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      encryptedToken,
      encryptedRefresh,
      tokenExpiresAt,
    },
    create: {
      userId: user.id,
      fanvueId: profile.id,
      fanvueHandle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      encryptedToken,
      encryptedRefresh,
      tokenExpiresAt,
    },
  });

  // Ensure settings record exists
  await prisma.creatorSettings.upsert({
    where: { creatorId: creator.id },
    update: {},
    create: { creatorId: creator.id },
  });

  // Sign session JWT
  const sessionJwt = await new SignJWT({ creatorId: creator.id, fanvueId: profile.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  // Clear state cookie, set session cookie
  response.cookies.delete(STATE_COOKIE);
  response.cookies.set(SESSION_COOKIE, sessionJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
