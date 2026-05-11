import { NextResponse } from "next/server";

const SESSION_COOKIE = "fba_session";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  );
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
