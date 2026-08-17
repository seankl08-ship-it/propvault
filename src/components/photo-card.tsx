"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Heart, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeletePhotoButton } from "@/components/delete-photo-button";

interface PhotoCardProps {
  albumId: string;
  photoId: string;
  url: string;
  filename: string;
  tags: string[];
  canDelete: boolean;
  uploaderName: string;
  likeCount: number;
  isLiked: boolean;
  mediaType: string;
}

export function PhotoCard({
  albumId,
  photoId,
  url,
  filename,
  tags,
  canDelete,
  uploaderName,
  likeCount,
  isLiked,
  mediaType,
}: PhotoCardProps) {
  const isVideo = mediaType === "video";
  const [liked, setLiked] = useState(isLiked);
  const [count, setCount] = useState(likeCount);
  const [pending, setPending] = useState(false);

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    if (pending) return;
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setPending(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]">
        <Link href={`/albums/${albumId}/photos/${photoId}`} className="block">
          <div className="relative aspect-square w-full overflow-hidden">
            {isVideo ? (
              <>
                <video
                  src={url}
                  controls
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white">
                    <Play className="h-6 w-6" fill="currentColor" />
                  </span>
                </span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={filename}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            )}
          </div>
        </Link>

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex justify-end gap-1 p-2">
            <button
              type="button"
              onClick={toggleLike}
              disabled={pending}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/50 text-white backdrop-blur hover:bg-black/70 disabled:opacity-60"
              title={liked ? "Unlike" : "Like"}
            >
              <Heart
                className="h-4 w-4"
                fill={liked ? "var(--pink)" : "none"}
                stroke={liked ? "var(--pink)" : "white"}
              />
            </button>
            <a
              href={`/api/photos/${photoId}/download`}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/50 text-white backdrop-blur hover:bg-black/70"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            {canDelete && (
              <div className="pointer-events-auto">
                <DeletePhotoButton photoId={photoId} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-1.5 space-y-1">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-[family-name:var(--font-mukta)] text-[13px] text-[var(--ink-3)]">
            {uploaderName}
          </span>
          <span className="flex shrink-0 items-center gap-1 font-[family-name:var(--font-mukta)] text-[13px] text-[var(--ink-3)]">
            <Heart
              className="h-3.5 w-3.5"
              fill={liked ? "var(--pink)" : "none"}
              stroke={liked ? "var(--pink)" : "currentColor"}
            />
            {count}
          </span>
        </div>
      </div>
    </div>
  );
}
