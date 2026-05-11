import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  draftBody: z.string().min(1).max(5000),
});

export async function PATCH(
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

  if (draft.sentAt) {
    return NextResponse.json({ error: "Cannot edit a sent draft" }, { status: 400 });
  }

  let body: { draftBody: string };
  try {
    const json = await request.json();
    body = patchSchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updated = await prisma.messageDraft.update({
    where: { id },
    data: { draftBody: body.draftBody },
  });

  return NextResponse.json({ ok: true, draft: updated });
}
