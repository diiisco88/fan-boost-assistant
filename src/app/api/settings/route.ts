import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await prisma.creator.findUnique({
    where: { id: session.creatorId },
    include: { settings: true },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  return NextResponse.json({
    creator: {
      id: creator.id,
      fanvueId: creator.fanvueId,
      fanvueHandle: creator.fanvueHandle,
      displayName: creator.displayName,
      avatarUrl: creator.avatarUrl,
      planTier: creator.planTier,
      subscriptionActive: creator.subscriptionActive,
      createdAt: creator.createdAt,
    },
    settings: creator.settings,
  });
}

const patchSchema = z.object({
  optOutKeywords: z.string().optional(),
});

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    const json = await request.json();
    body = patchSchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updateData: any = {};
  if (body.optOutKeywords !== undefined) updateData.optOutKeywords = body.optOutKeywords;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await prisma.creatorSettings.upsert({
    where: { creatorId: session.creatorId },
    update: updateData,
    create: { creatorId: session.creatorId, ...updateData },
  });

  await logAudit(session.creatorId, "settings.updated", { changes: body });

  return NextResponse.json({ ok: true });
}
