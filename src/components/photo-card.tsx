"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeletePhotoButton } from "@/components/delete-photo-button";

interface PhotoCardProps {
  albumId: string;
  photoId: string;
  url: string;
  filename: string;
  tags: string[];
  canDelete: boolean;
}

export function PhotoCard({
  albumId,
  photoId,
  url,
  filename,
  tags,
  canDelete,
}: PhotoCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]">
      <Link href={`/albums/${albumId}/photos/${photoId}`} className="block">
        <div className="aspect-square w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={filename}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex justify-end gap-1 p-2">
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
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-white/90 text-black">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
