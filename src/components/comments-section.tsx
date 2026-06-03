"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  userName: string;
}

interface CommentsSectionProps {
  photoId: string;
  currentUserId: string;
  isAdmin: boolean;
  initialComments: CommentItem[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommentsSection({
  photoId,
  currentUserId,
  isAdmin,
  initialComments,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = value.trim();
    if (!body || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const created = (await res.json()) as CommentItem;
        setComments((c) => [...c, created]);
        setValue("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(
      `/api/photos/${photoId}/comments?commentId=${commentId}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setComments((c) => c.filter((item) => item.id !== commentId));
    }
  }

  return (
    <div>
      <h2 className="mb-3 font-[family-name:var(--font-montserrat)] text-sm font-semibold text-[var(--ink)]">
        Comments
      </h2>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
            No comments yet.
          </p>
        ) : (
          comments.map((c) => {
            const canDelete = isAdmin || c.userId === currentUserId;
            return (
              <div
                key={c.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-[var(--line-2)] p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-montserrat)] text-[13px] font-semibold text-[var(--ink)]">
                      {c.userName}
                    </span>
                    <span className="font-[family-name:var(--font-mukta)] text-[11px] text-[var(--ink-3)]">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 break-words font-[family-name:var(--font-mukta)] text-sm text-[var(--ink)]">
                    {c.body}
                  </p>
                </div>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    title="Delete comment"
                    className="shrink-0 text-[var(--ink-3)] hover:text-[var(--pink)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a comment…"
          className="h-10 flex-1 rounded-[10px] border border-[var(--line-2)] px-3.5 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink)] focus:border-[var(--cyan)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(0,174,239,0.25)]"
        />
        <Button type="submit" disabled={submitting || !value.trim()}>
          {submitting ? "Posting…" : "Post"}
        </Button>
      </form>
    </div>
  );
}
