"use client";

import { useEffect, useState } from "react";
import { CircleCheck, TriangleAlert, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Creator {
  id: string;
  fanvueHandle: string;
  displayName: string;
  avatarUrl: string | null;
  planTier: string;
  subscriptionActive: boolean;
  createdAt: string;
}

interface Settings {
  id: string;
  optOutKeywords: string;
}

interface SettingsData {
  creator: Creator;
  settings: Settings | null;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [purging, setPurging] = useState(false);
  const [purged, setPurged] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setData(d);
        setKeywords(d.settings?.optOutKeywords ?? "");
        setLoading(false);
      });
  }, []);

  async function handleSaveKeywords() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optOutKeywords: keywords }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handlePurge() {
    if (purgeConfirm !== "DELETE") return;
    setPurging(true);
    const res = await fetch("/api/settings/purge?confirm=true", { method: "POST" });
    setPurging(false);
    if (res.ok) {
      setPurged(true);
      setShowPurgeModal(false);
    }
  }

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

  if (!data) return null;

  const { creator } = data;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
          Manage your account and preferences.
        </p>
      </div>

      {/* Connected account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <CardTitle>Connected Account</CardTitle>
          </div>
          <CardDescription>Your Fanvue account is linked to Fan Boost.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                className="w-12 h-12 rounded-full object-cover"
                alt={creator.displayName}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ background: "var(--primary)", color: "white" }}
              >
                {creator.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{creator.displayName}</p>
              <p className="text-sm" style={{ color: "#94A3B8" }}>
                @{creator.fanvueHandle}
              </p>
            </div>
            <div
              className="ml-auto flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "var(--success)" }}
            >
              <CircleCheck className="w-4 h-4" />
              Connected
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-4 pt-2 text-sm border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <p style={{ color: "#64748B" }}>Plan</p>
              <p className="font-medium capitalize mt-0.5">{creator.planTier}</p>
            </div>
            <div>
              <p style={{ color: "#64748B" }}>Member since</p>
              <p className="font-medium mt-0.5">
                {new Date(creator.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opt-out keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Opt-out Keywords</CardTitle>
          <CardDescription>
            Comma-separated keywords. If a subscriber sends any of these, they are automatically
            opted out from future automated drafts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="stop, unsubscribe, no more, leave me alone"
          />
          <Button onClick={handleSaveKeywords} disabled={saving} size="sm">
            {saving ? "Saving..." : saved ? "Saved!" : "Save keywords"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-900/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-red-400" />
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {purged ? (
            <div
              className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
              style={{ background: "rgba(52, 211, 153, 0.1)", color: "var(--success)" }}
            >
              <CircleCheck className="w-4 h-4" />
              All subscriber PII has been purged and message drafts deleted.
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: "#94A3B8" }}>
                <strong>Purge fan data</strong> — anonymises all subscriber names and removes
                all message drafts. Aggregate statistics are retained. This cannot be undone.
              </p>
              <Button variant="destructive" size="sm" onClick={() => setShowPurgeModal(true)}>
                Purge my fan data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purge confirmation modal */}
      {showPurgeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 space-y-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <TriangleAlert className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-red-400">Confirm purge</h2>
            </div>
            <p className="text-sm" style={{ color: "#94A3B8" }}>
              This will permanently anonymise all subscriber PII and delete all message drafts.
              You cannot undo this action.
            </p>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: "#94A3B8" }}>
                Type <code className="text-red-400">DELETE</code> to confirm
              </label>
              <Input
                value={purgeConfirm}
                onChange={(e) => setPurgeConfirm(e.target.value)}
                placeholder="DELETE"
                className="border-red-900/50 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handlePurge}
                disabled={purgeConfirm !== "DELETE" || purging}
              >
                {purging ? "Purging..." : "Confirm purge"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPurgeModal(false);
                  setPurgeConfirm("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
