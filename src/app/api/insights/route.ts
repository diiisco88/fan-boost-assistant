import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBestPostingHours, getHeatmapData } from "@/lib/posting-optimizer";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creatorId = session.creatorId;

  const [posts, topTippers, topPosts] = await Promise.all([
    prisma.post.findMany({
      where: { creatorId },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
    prisma.subscriber.findMany({
      where: { creatorId, tipCount: { gt: 0 } },
      orderBy: { totalTips: "desc" },
      take: 10,
    }),
    prisma.post.findMany({
      where: { creatorId },
      orderBy: { viewCount: "desc" },
      take: 10,
    }),
  ]);

  const postData = posts.map((p) => ({
    publishedAt: p.publishedAt,
    viewCount: p.viewCount,
    likeCount: p.likeCount,
    tipTotal: p.tipTotal,
  }));

  const heatmap = getHeatmapData(postData);
  const bestSlots = getBestPostingHours(postData);

  // Human-readable best window
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const bestWindow =
    bestSlots.length > 0
      ? `${DAYS[bestSlots[0].dayOfWeek]} at ${bestSlots[0].hour}:00–${bestSlots[0].hour + 1}:00`
      : null;

  return NextResponse.json({
    heatmap,
    bestSlots,
    bestWindow,
    topTippers: topTippers.map((s, idx) => ({
      rank: idx + 1,
      id: s.id,
      name: s.displayName,
      avatarUrl: s.avatarUrl,
      totalTips: s.totalTips,
      tipCount: s.tipCount,
      lastActive: s.lastInteractedAt,
    })),
    topPosts: topPosts.map((p) => ({
      id: p.id,
      fanvuePostId: p.fanvuePostId,
      title: p.title,
      publishedAt: p.publishedAt,
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      tipTotal: p.tipTotal,
    })),
  });
}
