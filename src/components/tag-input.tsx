"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TagInput({
  photoId,
  initialTags,
}: {
  photoId: string;
  initialTags: string[];
}) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function addTag(code: string) {
    const trimmed = code.trim();
    if (!trimmed || tags.includes(trimmed)) {
      setValue("");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/photos/${photoId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
    });
    setBusy(false);
    if (res.ok) {
      setTags((prev) => [...prev, trimmed]);
      setValue("");
      router.refresh();
    }
  }

  async function removeTag(code: string) {
    setBusy(true);
    const res = await fetch(
      `/api/photos/${photoId}/tags?code=${encodeURIComponent(code)}`,
      { method: "DELETE" },
    );
    setBusy(false);
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t !== code));
      router.refresh();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(value);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && (
          <span className="text-sm text-[var(--muted-foreground)]">No tags yet.</span>
        )}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-3 py-1 text-sm text-[var(--foreground)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={busy}
              className="rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add product code and press Enter"
        disabled={busy}
      />
    </div>
  );
}
