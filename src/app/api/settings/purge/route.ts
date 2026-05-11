import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const confirmed = searchParams.get("confirm") === "true";

  if (!confirmed) {
    return NextResponse.json(
      {
        error: "Confirmation required. Pass ?confirm=true to proceed.",
        warning:
          "This will permanently delete all subscriber PII and message drafts for your account.",
      },
      { status: 400 }
    );
  }

  const creatorId = session.creatorId;

  // Anonymize all subscriber PII
  await prisma.subscriber.updateMany({
    where: { creatorId },
    data: {
      displayName: "Deleted User",
      username: null,
      avatarUrl: null,
      optedOut: true,
    },
  });

  // Delete all message drafts
  await prisma.messageDraft.deleteMany({
    where: { creatorId },
  });

  await logAudit(creatorId, "settings.purge_pii", {
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    message: "All subscriber PII has been anonymized and message drafts have been deleted.",
  });
}
