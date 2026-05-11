import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Creator } from "@prisma/client";

const SESSION_COOKIE = "fba_session";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  creatorId: string;
  fanvueId: string;
}

export async function getSession(request?: Request): Promise<SessionPayload | null> {
  try {
    let token: string | undefined;

    if (request) {
      // Read from request cookies header
      const cookieHeader = request.headers.get("cookie") ?? "";
      const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
      token = match?.split("=").slice(1).join("=");
    } else {
      // Read from Next.js cookies() (server components / route handlers)
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE)?.value;
    }

    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    const creatorId = payload["creatorId"] as string;
    const fanvueId = payload["fanvueId"] as string;

    if (!creatorId || !fanvueId) return null;

    return { creatorId, fanvueId };
  } catch {
    return null;
  }
}

export async function getCreatorFromSession(request?: Request): Promise<Creator | null> {
  const session = await getSession(request);
  if (!session) return null;

  const creator = await prisma.creator.findUnique({
    where: { id: session.creatorId },
  });

  return creator;
}
