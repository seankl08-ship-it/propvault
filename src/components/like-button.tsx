"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  photoId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({
  photoId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;

    // Optimistic update.
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setPending(true);

    try {
      const res = await fetch(`/api/photos/${photoId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      // Roll back on error.
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--line-2)] px-3.5 py-2 font-[family-name:var(--font-montserrat)] text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--bg)] disabled:opacity-60"
      title={liked ? "Unlike" : "Like"}
    >
      <Heart
        className="h-4 w-4"
        fill={liked ? "var(--pink)" : "none"}
        stroke={liked ? "var(--pink)" : "currentColor"}
      />
      {count}
    </button>
  );
}
