"use client";

import { useEffect, useState, useCallback } from "react";
import { CircleCheck } from "lucide-react";
import { DraftCard } from "@/components/DraftCard";

interface Subscriber {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Draft {
  id: string;
  type: string;
  draftBody: string;
  createdAt: string;
  subscriber: Subscriber;
}

export default function MessagesPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/messages?status=pending&page=${page}&limit=20`);
    if (res.ok) {
      const data = await res.json();
      setDrafts(data.drafts ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  async function handleSend(id: string) {
    const res = await fetch(`/api/messages/${id}/send`, { method: "POST" });
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    }
  }

  async function handleDismiss(id: string) {
    const res = await fetch(`/api/messages/${id}/dismiss`, { method: "POST" });
    if (res.ok) {
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      setTotal((t) => Math.max(0, t - 1));
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
          {total} pending draft{total !== 1 ? "s" : ""} awaiting your approval
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-3 rounded-xl border px-5 py-4 text-sm"
        style={{
          background: "rgba(124, 58, 237, 0.08)",
          borderColor: "rgba(124, 58, 237, 0.25)",
          color: "#A78BFA",
        }}
      >
        <CircleCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          These messages were drafted automatically but <strong>will not send</strong> until
          you click Send. Review each one, edit if needed, then approve.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
          />
        </div>
      ) : drafts.length === 0 ? (
        <div
          className="rounded-xl border p-16 text-center"
          style={{ borderColor: "var(--border)", color: "#64748B" }}
        >
          <CircleCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-medium mb-2">All caught up</p>
          <p className="text-sm">No pending drafts right now. Check back after new subscribers join or tips arrive.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm" style={{ color: "#64748B" }}>
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 transition-colors hover:bg-[#1E1E2E]"
                  style={{ borderColor: "var(--border)", color: "#94A3B8" }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-lg text-sm border disabled:opacity-40 transition-colors hover:bg-[#1E1E2E]"
                  style={{ borderColor: "var(--border)", color: "#94A3B8" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
