import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";
import { sendMessage } from "@/lib/fanvue";
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

  const draft = await prisma.messageDraft.findUnique({
    where: { id },
    include: { subscriber: true },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  if (draft.creatorId !== session.creatorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (draft.sentAt) {
    return NextResponse.json({ error: "Draft already sent" }, { status: 400 });
  }

  if (draft.dismissed) {
    return NextResponse.json({ error: "Draft was dismissed" }, { status: 400 });
  }

  const creator = await prisma.creator.findUnique({
    where: { id: session.creatorId },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  let accessToken: string;
  try {
    accessToken = await decryptToken(creator.encryptedToken);
  } catch {
    return NextResponse.json({ error: "Failed to decrypt token" }, { status: 500 });
  }

  try {
    await sendMessage(accessToken, draft.subscriber.fanvueFanId, { text: draft.draftBody });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  await prisma.messageDraft.update({
    where: { id },
    data: { sentAt: new Date() },
  });

  await logAudit(session.creatorId, "message.sent", {
    draftId: id,
    subscriberId: draft.subscriberId,
    type: draft.type,
  });

  return NextResponse.json({ ok: true });
}
