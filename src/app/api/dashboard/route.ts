import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creatorId = session.creatorId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeSubscribers,
    churnRiskCount,
    tipsThisMonth,
    pendingDrafts,
    thirtyDaysAgoSubs,
    stillActiveSubs,
    recentDrafts,
    recentTips,
  ] = await Promise.all([
    prisma.subscriber.count({
      where: { creatorId, status: "active" },
    }),
    prisma.subscriber.count({
      where: { creatorId, churnRiskScore: { gt: 60 } },
    }),
    prisma.tip.aggregate({
      where: { creatorId, receivedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.messageDraft.count({
      where: { creatorId, sentAt: null, dismissed: false },
    }),
    // Subscribers who joined before 30 days ago
    prisma.subscriber.count({
      where: { creatorId, subscribedAt: { lte: thirtyDaysAgo } },
    }),
    // Subscribers who joined before 30 days ago and are still active
    prisma.subscriber.count({
      where: {
        creatorId,
        subscribedAt: { lte: thirtyDaysAgo },
        status: "active",
      },
    }),
    // Recent draft activity
    prisma.messageDraft.findMany({
      where: { creatorId, sentAt: { not: null } },
      orderBy: { sentAt: "desc" },
      take: 5,
      include: { subscriber: { select: { displayName: true } } },
    }),
    // Recent tips
    prisma.tip.findMany({
      where: { creatorId },
      orderBy: { receivedAt: "desc" },
      take: 5,
      include: { subscriber: { select: { displayName: true } } },
    }),
  ]);

  const mrrEstimate = activeSubscribers * 9.99;
  const tipsThisMonthTotal = tipsThisMonth._sum.amount ?? 0;
  const retentionRate =
    thirtyDaysAgoSubs > 0
      ? Math.round((stillActiveSubs / thirtyDaysAgoSubs) * 100)
      : 100;

  // Build recent activity list
  const recentActivity: Array<{ type: string; label: string; createdAt: string }> = [];

  for (const draft of recentDrafts) {
    recentActivity.push({
      type: "message_sent",
      label: `Message sent to ${draft.subscriber.displayName}`,
      createdAt: draft.sentAt!.toISOString(),
    });
  }

  for (const tip of recentTips) {
    recentActivity.push({
      type: "tip_received",
      label: `Tip of $${tip.amount.toFixed(2)} from ${tip.subscriber.displayName}`,
      createdAt: tip.receivedAt.toISOString(),
    });
  }

  recentActivity.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({
    activeSubscribers,
    mrrEstimate: Math.round(mrrEstimate * 100) / 100,
    churnRisk: churnRiskCount,
    tipsThisMonth: Math.round(tipsThisMonthTotal * 100) / 100,
    pendingDrafts,
    retentionRate,
    recentActivity: recentActivity.slice(0, 10),
  });
}
