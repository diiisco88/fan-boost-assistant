import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const sort = searchParams.get("sort") ?? "date";
  const status = searchParams.get("status") ?? undefined;
  const skip = (page - 1) * limit;

  const where: any = { creatorId: session.creatorId };
  if (status === "active" || status === "churned") {
    where.status = status;
  }

  let orderBy: any;
  switch (sort) {
    case "churn":
      orderBy = { churnRiskScore: "desc" };
      break;
    case "tips":
      orderBy = { totalTips: "desc" };
      break;
    case "date":
    default:
      orderBy = { subscribedAt: "desc" };
  }

  const [subscribers, total] = await Promise.all([
    prisma.subscriber.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.subscriber.count({ where }),
  ]);

  return NextResponse.json({
    subscribers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
