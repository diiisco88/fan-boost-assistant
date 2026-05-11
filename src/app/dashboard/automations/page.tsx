"use client";

import { useEffect, useState } from "react";
import { Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch, SwitchThumb } from "@radix-ui/react-switch";

interface AutomationSettings {
  welcome: { enabled: boolean; template: string; runCount: number; lastRunAt: string | null };
  thankYou: { enabled: boolean; template: string; runCount: number; lastRunAt: string | null };
  reengage: {
    enabled: boolean;
    template: string;
    daysThreshold: number;
    runCount: number;
    lastRunAt: string | null;
  };
}

function formatDate(d: string | null): string {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString();
}

interface AutomationCardProps {
  title: string;
  description: string;
  enabled: boolean;
  template: string;
  runCount: number;
  lastRunAt: string | null;
  extra?: React.ReactNode;
  onToggle: (v: boolean) => void;
  onSave: (template: string) => Promise<void>;
}

function AutomationCard({
  title,
  description,
  enabled,
  template,
  runCount,
  lastRunAt,
  extra,
  onToggle,
  onSave,
}: AutomationCardProps) {
  const [localTemplate, setLocalTemplate] = useState(template);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(localTemplate);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0"
            style={{
              background: enabled ? "var(--primary)" : "var(--border)",
            }}
          >
            <SwitchThumb
              className="block h-4 w-4 rounded-full bg-white transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1"
            />
          </Switch>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm" style={{ color: "#64748B" }}>
          <span>Runs: {runCount}</span>
          <span>Last run: {formatDate(lastRunAt)}</span>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: "#94A3B8" }}>
            Message template
          </label>
          <Textarea
            value={localTemplate}
            onChange={(e) => setLocalTemplate(e.target.value)}
            rows={4}
            placeholder="Use {{name}} for subscriber name, {{amount}} for tip amount"
            disabled={!enabled}
          />
          <p className="text-xs mt-1.5" style={{ color: "#64748B" }}>
            Variables: <code className="text-[#22D3EE]">{"{{name}}"}</code>
            {" · "}
            <code className="text-[#22D3EE]">{"{{amount}}"}</code>
          </p>
        </div>

        {extra}

        <Button
          onClick={handleSave}
          disabled={saving || !enabled}
          size="sm"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save template"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AutomationsPage() {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/automations")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        setLoading(false);
      });
  }, []);

  async function update(patch: object) {
    const res = await fetch("/api/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok && settings) {
      // Re-fetch to sync
      const updated = await fetch("/api/automations").then((r) => r.json());
      setSettings(updated);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-40">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Automations</h1>
        <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
          Configure what Fan Boost drafts for you.
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-3 rounded-xl border px-5 py-4"
        style={{
          background: "rgba(124, 58, 237, 0.08)",
          borderColor: "rgba(124, 58, 237, 0.25)",
        }}
      >
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#A78BFA" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#A78BFA" }}>
            All messages are drafted only — you approve before anything sends.
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#7C6CAE" }}>
            Fan Boost never sends anything without your explicit approval. Every draft waits in
            your Messages inbox until you review it.
          </p>
        </div>
      </div>

      {/* Welcome DM */}
      <AutomationCard
        title="Welcome DM"
        description="Drafted when a new subscriber joins. Lets them know you're glad they're here."
        enabled={settings.welcome.enabled}
        template={settings.welcome.template}
        runCount={settings.welcome.runCount}
        lastRunAt={settings.welcome.lastRunAt}
        onToggle={(v) => update({ welcome: { enabled: v } })}
        onSave={(template) => update({ welcome: { template } })}
      />

      {/* Tip Thank-You */}
      <AutomationCard
        title="Tip Thank-You"
        description="Drafted when a fan sends a tip. Use {{amount}} to include the tip value."
        enabled={settings.thankYou.enabled}
        template={settings.thankYou.template}
        runCount={settings.thankYou.runCount}
        lastRunAt={settings.thankYou.lastRunAt}
        onToggle={(v) => update({ thankYou: { enabled: v } })}
        onSave={(template) => update({ thankYou: { template } })}
      />

      {/* Re-engagement */}
      <AutomationCard
        title="Re-engagement"
        description="Drafted for subscribers who haven't interacted for a set number of days."
        enabled={settings.reengage.enabled}
        template={settings.reengage.template}
        runCount={settings.reengage.runCount}
        lastRunAt={settings.reengage.lastRunAt}
        onToggle={(v) => update({ reengage: { enabled: v } })}
        onSave={(template) => update({ reengage: { template } })}
        extra={
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: "#94A3B8" }}>
              Trigger after days inactive
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={settings.reengage.daysThreshold}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v > 0) {
                    setSettings((prev) =>
                      prev
                        ? { ...prev, reengage: { ...prev.reengage, daysThreshold: v } }
                        : prev
                    );
                  }
                }}
                onBlur={() =>
                  update({ reengage: { daysThreshold: settings.reengage.daysThreshold } })
                }
                className="w-20 h-9 rounded-lg border px-3 text-sm text-center"
                style={{
                  background: "var(--muted)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
                disabled={!settings.reengage.enabled}
              />
              <span className="text-sm" style={{ color: "#64748B" }}>
                days
              </span>
            </div>
          </div>
        }
      />

      <div
        className="flex items-center gap-2 text-sm rounded-lg px-4 py-3 border"
        style={{
          borderColor: "var(--border)",
          color: "#64748B",
          background: "var(--card)",
        }}
      >
        <Zap className="w-4 h-4" style={{ color: "var(--warning)" }} />
        Re-engagement drafts are generated by a background job that runs daily. Only subscribers
        who have not opted out are included.
      </div>
    </div>
  );
}
