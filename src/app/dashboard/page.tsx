"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, TriangleAlert, Coins, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DraftCard } from "@/components/DraftCard";

interface DashboardData {
  activeSubscribers: number;
  mrrEstimate: number;
  churnRisk: number;
  tipsThisMonth: number;
  pendingDrafts: number;
  retentionRate: number;
  recentActivity: Array<{ type: string; label: string; createdAt: string }>;
}

interface PendingDraft {
  id: string;
  type: string;
  draftBody: string;
  createdAt: string;
  subscriber: { id: string; displayName: string; avatarUrl: string | null };
}

const ACTIVITY_ICONS: Record<string, string> = {
  message_sent: "💬",
  tip_received: "💰",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [dashRes, draftsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/subscribers?limit=3"),
      ]);

      if (dashRes.ok) {
        setData(await dashRes.json());
      }

      // Also load pending drafts
      const draftsApiRes = await fetch(
        "/api/messages?status=pending&limit=3"
      );
      if (draftsApiRes.ok) {
        const d = await draftsApiRes.json();
        setDrafts(d.drafts ?? []);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleSend(id: string) {
    const res = await fetch(`/api/messages/${id}/send`, { method: "POST" });
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setData((prev) => prev ? { ...prev, pendingDrafts: Math.max(0, prev.pendingDrafts - 1) } : prev);
    }
  }

  async function handleDismiss(id: string) {
    const res = await fetch(`/api/messages/${id}/dismiss`, { method: "POST" });
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setData((prev) => prev ? { ...prev, pendingDrafts: Math.max(0, prev.pendingDrafts - 1) } : prev);
    }
  }

  async function handleEdit(id: string, body: string) {
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftBody: body }),
    });
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, draftBody: body } : d))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const kpis = [
    {
      label: "Active Subscribers",
      value: data?.activeSubscribers ?? 0,
      icon: Users,
      color: "var(--primary)",
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "MRR (Est.)",
      value: data?.mrrEstimate ?? 0,
      icon: DollarSign,
      color: "var(--accent)",
      format: (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      label: "Churn Risk",
      value: data?.churnRisk ?? 0,
      icon: TriangleAlert,
      color: "var(--warning)",
      format: (v: number) => v.toString(),
    },
    {
      label: "Tips This Month",
      value: data?.tipsThisMonth ?? 0,
      icon: Coins,
      color: "var(--success)",
      format: (v: number) => `$${v.toFixed(2)}`,
    },
    {
      label: "Pending Approvals",
      value: data?.pendingDrafts ?? 0,
      icon: Clock,
      color: "var(--primary)",
      format: (v: number) => v.toString(),
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
          Your creator overview at a glance.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="pb-2 p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium" style={{ color: "#94A3B8" }}>
                    {kpi.label}
                  </CardTitle>
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                  {kpi.format(kpi.value)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Retention */}
      {data && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: "var(--success)" }} />
              <CardTitle className="text-sm">30-Day Retention Rate</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold" style={{ color: "var(--success)" }}>
                {data.retentionRate}%
              </span>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "var(--muted)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${data.retentionRate}%`,
                    background: "var(--success)",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending approvals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pending Approvals</h2>
          {(data?.pendingDrafts ?? 0) > 0 && (
            <Badge variant="warning">{data?.pendingDrafts} waiting</Badge>
          )}
        </div>

        {drafts.length === 0 ? (
          <div
            className="rounded-xl border p-10 text-center"
            style={{ borderColor: "var(--border)", color: "#64748B" }}
          >
            <p className="text-lg mb-1">All caught up</p>
            <p className="text-sm">No pending drafts right now.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onSend={handleSend}
                onDismiss={handleDismiss}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      {data && data.recentActivity.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {data.recentActivity.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-lg">{ACTIVITY_ICONS[item.type] ?? "•"}</span>
                    <span className="text-sm flex-1" style={{ color: "#CBD5E1" }}>
                      {item.label}
                    </span>
                    <span className="text-xs" style={{ color: "#64748B" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
