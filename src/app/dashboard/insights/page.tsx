"use client";

import { useEffect, useState } from "react";
import { Clock, Trophy, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HeatmapCell {
  day: number;
  hour: number;
  score: number;
}

interface TopTipper {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  totalTips: number;
  tipCount: number;
  lastActive: string | null;
}

interface TopPost {
  id: string;
  fanvuePostId: string;
  title: string | null;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  tipTotal: number;
}

interface InsightsData {
  heatmap: HeatmapCell[];
  bestSlots: Array<{ hour: number; score: number; dayOfWeek: number }>;
  bestWindow: string | null;
  topTippers: TopTipper[];
  topPosts: TopPost[];
}

function getHeatmapColor(score: number, maxScore: number): string {
  if (maxScore === 0) return "rgba(124, 58, 237, 0.05)";
  const intensity = score / maxScore;
  return `rgba(124, 58, 237, ${0.05 + intensity * 0.85})`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!data) {
    return <p style={{ color: "#64748B" }}>Failed to load insights.</p>;
  }

  // Build heatmap grid lookup
  const heatGrid: Record<string, number> = {};
  let maxScore = 0;
  for (const cell of data.heatmap) {
    heatGrid[`${cell.day}-${cell.hour}`] = cell.score;
    if (cell.score > maxScore) maxScore = cell.score;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
          Performance data to help you post smarter and reward your top fans.
        </p>
      </div>

      {/* Best posting time */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <CardTitle>Posting Optimizer</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.bestWindow && (
            <div
              className="rounded-xl border px-5 py-4"
              style={{
                background: "rgba(34, 211, 238, 0.08)",
                borderColor: "rgba(34, 211, 238, 0.25)",
              }}
            >
              <p className="text-sm" style={{ color: "#94A3B8" }}>
                Your best window
              </p>
              <p className="text-xl font-bold mt-1" style={{ color: "var(--accent)" }}>
                {data.bestWindow}
              </p>
            </div>
          )}

          {data.heatmap.length === 0 ? (
            <p className="text-sm" style={{ color: "#64748B" }}>
              No post data yet. Publish some posts on Fanvue and sync to see engagement patterns.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div>
                {/* Hour labels */}
                <div className="flex ml-10 mb-1">
                  {HOURS.filter((h) => h % 3 === 0).map((h) => (
                    <div
                      key={h}
                      className="text-xs"
                      style={{
                        color: "#64748B",
                        width: `${(3 / 24) * 100}%`,
                        minWidth: "30px",
                      }}
                    >
                      {h}:00
                    </div>
                  ))}
                </div>
                {DAYS.map((day, dayIdx) => (
                  <div key={day} className="flex items-center gap-1 mb-1">
                    <span
                      className="text-xs w-9 text-right flex-shrink-0"
                      style={{ color: "#64748B" }}
                    >
                      {day}
                    </span>
                    <div className="flex gap-px flex-1">
                      {HOURS.map((hour) => {
                        const score = heatGrid[`${dayIdx}-${hour}`] ?? 0;
                        return (
                          <div
                            key={hour}
                            className="flex-1 rounded-sm"
                            style={{
                              height: "22px",
                              background: getHeatmapColor(score, maxScore),
                              minWidth: "10px",
                            }}
                            title={`${day} ${hour}:00 — score: ${Math.round(score)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs" style={{ color: "#64748B" }}>
                  Low engagement
                </span>
                <div
                  className="flex-1 max-w-32 h-2 rounded"
                  style={{
                    background: "linear-gradient(to right, rgba(124,58,237,0.05), rgba(124,58,237,0.9))",
                  }}
                />
                <span className="text-xs" style={{ color: "#64748B" }}>
                  High
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top fans */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: "var(--warning)" }} />
              <CardTitle>Top Fans</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.topTippers.length === 0 ? (
              <p className="px-5 pb-5 text-sm" style={{ color: "#64748B" }}>
                No tip data yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-5 py-2 text-left font-medium" style={{ color: "#94A3B8" }}>
                      Rank
                    </th>
                    <th className="px-4 py-2 text-left font-medium" style={{ color: "#94A3B8" }}>
                      Fan
                    </th>
                    <th className="px-4 py-2 text-right font-medium" style={{ color: "#94A3B8" }}>
                      Total Tips
                    </th>
                    <th className="px-4 py-2 text-right font-medium" style={{ color: "#94A3B8" }}>
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTippers.map((fan) => (
                    <tr
                      key={fan.id}
                      className="border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-5 py-3">
                        <span
                          className="font-bold text-base"
                          style={{
                            color:
                              fan.rank === 1
                                ? "#F59E0B"
                                : fan.rank === 2
                                ? "#94A3B8"
                                : fan.rank === 3
                                ? "#CD7C2F"
                                : "#64748B",
                          }}
                        >
                          #{fan.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {fan.avatarUrl ? (
                            <img
                              src={fan.avatarUrl}
                              className="w-7 h-7 rounded-full object-cover"
                              alt={fan.name}
                            />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{ background: "var(--primary)", color: "white" }}
                            >
                              {getInitials(fan.name)}
                            </div>
                          )}
                          <span>{fan.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: "var(--success)" }}>
                        ${fan.totalTips.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: "#94A3B8" }}>
                        {fan.tipCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Top posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <CardTitle>Top Posts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.topPosts.length === 0 ? (
              <p className="px-5 pb-5 text-sm" style={{ color: "#64748B" }}>
                No post data yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-5 py-2 text-left font-medium" style={{ color: "#94A3B8" }}>
                      Post
                    </th>
                    <th className="px-4 py-2 text-right font-medium" style={{ color: "#94A3B8" }}>
                      Views
                    </th>
                    <th className="px-4 py-2 text-right font-medium" style={{ color: "#94A3B8" }}>
                      Likes
                    </th>
                    <th className="px-4 py-2 text-right font-medium" style={{ color: "#94A3B8" }}>
                      Tips
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium truncate max-w-32">
                          {post.title ?? post.fanvuePostId}
                        </p>
                        <p className="text-xs" style={{ color: "#64748B" }}>
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: "#94A3B8" }}>
                        {post.viewCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: "#94A3B8" }}>
                        {post.likeCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: "var(--success)" }}>
                        ${post.tipTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
