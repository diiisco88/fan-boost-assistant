interface PostData {
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  tipTotal: number;
}

interface PostDataForHeatmap {
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
}

interface PostingSlot {
  hour: number;
  score: number;
  dayOfWeek: number;
}

interface HeatmapCell {
  day: number;
  hour: number;
  score: number;
}

export function getBestPostingHours(posts: PostData[]): PostingSlot[] {
  if (posts.length === 0) return [];

  // Aggregate scores by [dayOfWeek, hour]
  const slotMap = new Map<string, { totalScore: number; count: number }>();

  for (const post of posts) {
    const date = new Date(post.publishedAt);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const key = `${dayOfWeek}-${hour}`;

    // Normalize: views count 1x, likes 2x, tips 10x per unit
    const score = post.viewCount * 1 + post.likeCount * 2 + post.tipTotal * 10;

    const existing = slotMap.get(key);
    if (existing) {
      existing.totalScore += score;
      existing.count += 1;
    } else {
      slotMap.set(key, { totalScore: score, count: 1 });
    }
  }

  const slots: PostingSlot[] = [];
  for (const [key, { totalScore, count }] of slotMap.entries()) {
    const [dayStr, hourStr] = key.split("-");
    slots.push({
      dayOfWeek: parseInt(dayStr, 10),
      hour: parseInt(hourStr, 10),
      score: count > 0 ? totalScore / count : 0,
    });
  }

  // Sort by average score descending, return top 5
  slots.sort((a, b) => b.score - a.score);
  return slots.slice(0, 5);
}

export function getHeatmapData(posts: PostDataForHeatmap[]): HeatmapCell[] {
  // Initialize 7×24 grid
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const counts: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  for (const post of posts) {
    const date = new Date(post.publishedAt);
    const day = date.getDay(); // 0=Sunday
    const hour = date.getHours();
    const score = post.viewCount * 1 + post.likeCount * 2;
    grid[day][hour] += score;
    counts[day][hour] += 1;
  }

  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const count = counts[day][hour];
      cells.push({
        day,
        hour,
        score: count > 0 ? grid[day][hour] / count : 0,
      });
    }
  }

  return cells;
}
