"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChurnBadge } from "@/components/ChurnBadge";
import { Badge } from "@/components/ui/badge";

interface Subscriber {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  subscribedAt: string;
  lastInteractedAt: string | null;
  totalTips: number;
  churnRiskScore: number;
  isVip: boolean;
  status: string;
}

type SortKey = "date" | "tips" | "churn";
type SortDir = "asc" | "desc";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      sort,
      page: page.toString(),
      limit: "20",
    });
    if (statusFilter !== "all") params.set("status", statusFilter);

    const res = await fetch(`/api/subscribers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setSubscribers(data.subscribers);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    }
    setLoading(false);
  }, [sort, page, statusFilter]);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  function handleSort(key: SortKey) {
    if (sort === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  const filtered = subscribers.filter((s) =>
    s.displayName.toLowerCase().includes(search.toLowerCase()) ||
    (s.username ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort !== col) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Subscribers</h1>
        <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
          {total} total subscribers
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "#64748B" }}
          />
          <Input
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {["all", "active", "churned"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors"
              style={{
                background: statusFilter === s ? "var(--primary)" : "var(--muted)",
                color: statusFilter === s ? "white" : "#94A3B8",
                border: "1px solid",
                borderColor: statusFilter === s ? "var(--primary)" : "var(--border)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: "#94A3B8" }}>
                    Subscriber
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                    style={{ color: "#94A3B8" }}
                    onClick={() => handleSort("date")}
                  >
                    Subscribed <SortIcon col="date" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "#94A3B8" }}>
                    Last Active
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                    style={{ color: "#94A3B8" }}
                    onClick={() => handleSort("tips")}
                  >
                    Tips <SortIcon col="tips" />
                  </th>
                  <th
                    className="text-left px-4 py-3 font-medium cursor-pointer select-none"
                    style={{ color: "#94A3B8" }}
                    onClick={() => handleSort("churn")}
                  >
                    Churn Risk <SortIcon col="churn" />
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center" style={{ color: "#64748B" }}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center" style={{ color: "#64748B" }}>
                      No subscribers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b transition-colors hover:bg-[#1E1E2E]/50"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {sub.avatarUrl ? (
                            <img
                              src={sub.avatarUrl}
                              alt={sub.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{ background: "var(--primary)", color: "white" }}
                            >
                              {getInitials(sub.displayName)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{sub.displayName}</p>
                            {sub.username && (
                              <p className="text-xs" style={{ color: "#64748B" }}>
                                @{sub.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#94A3B8" }}>
                        {new Date(sub.subscribedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#94A3B8" }}>
                        {sub.lastInteractedAt
                          ? new Date(sub.lastInteractedAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ color: "var(--success)" }}>
                          ${sub.totalTips.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ChurnBadge score={sub.churnRiskScore} />
                      </td>
                      <td className="px-4 py-3">
                        {sub.isVip && (
                          <Badge variant="warning">
                            <Star className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded text-sm border disabled:opacity-40 transition-colors hover:bg-[#1E1E2E]"
                  style={{ borderColor: "var(--border)", color: "#94A3B8" }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded text-sm border disabled:opacity-40 transition-colors hover:bg-[#1E1E2E]"
                  style={{ borderColor: "var(--border)", color: "#94A3B8" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
