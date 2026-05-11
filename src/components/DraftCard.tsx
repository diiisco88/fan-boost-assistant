"use client";

import { useState } from "react";
import { Send, X, Pencil, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";

interface DraftSubscriber {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Draft {
  id: string;
  type: string;
  draftBody: string;
  createdAt: string;
  subscriber: DraftSubscriber;
}

interface DraftCardProps {
  draft: Draft;
  onSend: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onEdit: (id: string, body: string) => Promise<void>;
}

const TYPE_LABELS: Record<string, string> = {
  welcome: "Welcome",
  thank_you: "Thank You",
  reengage: "Re-engage",
};

const TYPE_VARIANTS: Record<string, "default" | "success" | "accent" | "warning"> = {
  welcome: "default",
  thank_you: "success",
  reengage: "accent",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function DraftCard({ draft, onSend, onDismiss, onEdit }: DraftCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [body, setBody] = useState(draft.draftBody);
  const [isSending, setIsSending] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function handleSend() {
    setIsSending(true);
    try {
      await onSend(draft.id);
    } finally {
      setIsSending(false);
    }
  }

  async function handleDismiss() {
    setIsDismissing(true);
    try {
      await onDismiss(draft.id);
    } finally {
      setIsDismissing(false);
    }
  }

  async function handleSaveEdit() {
    setIsSavingEdit(true);
    try {
      await onEdit(draft.id, body);
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  }

  const typeLabel = TYPE_LABELS[draft.type] ?? draft.type;
  const typeBadgeVariant = TYPE_VARIANTS[draft.type] ?? "outline";

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          {draft.subscriber.avatarUrl ? (
            <img
              src={draft.subscriber.avatarUrl}
              alt={draft.subscriber.displayName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
              style={{ background: "var(--primary)", color: "white" }}
            >
              {getInitials(draft.subscriber.displayName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{draft.subscriber.displayName}</p>
            <p className="text-xs" style={{ color: "#64748B" }}>
              {new Date(draft.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant={typeBadgeVariant as any}>{typeLabel}</Badge>
      </div>

      {/* Body */}
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || body.trim().length === 0}
            >
              <Check className="w-3 h-3" />
              {isSavingEdit ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setBody(draft.draftBody);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p
          className="text-sm leading-relaxed rounded-lg p-3"
          style={{ background: "var(--muted)", color: "#CBD5E1" }}
        >
          {body}
        </p>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSend} disabled={isSending || isDismissing}>
            <Send className="w-3 h-3" />
            {isSending ? "Sending..." : "Send"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsEditing(true)}
            disabled={isSending || isDismissing}
          >
            <Pencil className="w-3 h-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={isSending || isDismissing}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="w-3 h-3" />
            {isDismissing ? "Dismissing..." : "Dismiss"}
          </Button>
        </div>
      )}
    </div>
  );
}
