import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // "pending" | "sent" | "dismissed"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where: any = { creatorId: session.creatorId };

  if (status === "pending") {
    where.sentAt = null;
    where.dismissed = false;
  } else if (status === "sent") {
    where.sentAt = { not: null };
  } else if (status === "dismissed") {
    where.dismissed = true;
  }

  const [drafts, total] = await Promise.all([
    prisma.messageDraft.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        subscriber: {
          select: { id: true, displayName: true, avatarUrl: true, fanvueFanId: true },
        },
      },
    }),
    prisma.messageDraft.count({ where }),
  ]);

  return NextResponse.json({
    drafts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
