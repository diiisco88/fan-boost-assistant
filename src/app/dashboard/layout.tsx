import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import { LogOut } from "lucide-react";

const SESSION_COOKIE = "fba_session";

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function getSessionData(): Promise<{ creatorId: string; fanvueId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const creatorId = payload["creatorId"] as string;
    const fanvueId = payload["fanvueId"] as string;
    if (!creatorId || !fanvueId) return null;
    return { creatorId, fanvueId };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionData();

  if (!session) {
    redirect("/");
  }

  const creator = await prisma.creator.findUnique({
    where: { id: session.creatorId },
  });

  if (!creator) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div />
          <div className="flex items-center gap-3">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ background: "var(--primary)", color: "white" }}
              >
                {creator.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium">{creator.displayName}</span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#1E1E2E]"
                style={{ borderColor: "var(--border)", color: "#94A3B8" }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
