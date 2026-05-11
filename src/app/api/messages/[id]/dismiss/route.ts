import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const draft = await prisma.messageDraft.findUnique({ where: { id } });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  if (draft.creatorId !== session.creatorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.messageDraft.update({
    where: { id },
    data: { dismissed: true },
  });

  await logAudit(session.creatorId, "message.dismissed", {
    draftId: id,
    subscriberId: draft.subscriberId,
    type: draft.type,
  });

  return NextResponse.json({ ok: true });
}
