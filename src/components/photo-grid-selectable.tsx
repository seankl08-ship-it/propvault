"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Trash2 } from "lucide-react";
import { PhotoCard } from "@/components/photo-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface SelectablePhoto {
  id: string;
  url: string;
  filename: string;
  tags: string[];
  canDelete: boolean;
  uploaderName: string;
  likeCount: number;
  isLiked: boolean;
  mediaType: string;
}

interface PhotoGridSelectableProps {
  albumId: string;
  photos: SelectablePhoto[];
}

export function PhotoGridSelectable({
  albumId,
  photos,
}: PhotoGridSelectableProps) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSelectMode() {
    setSelecting((s) => !s);
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/photos/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: [...selected] }),
      });
      if (!res.ok) throw new Error("failed");
      setConfirmOpen(false);
      setSelected(new Set());
      setSelecting(false);
      router.refresh();
    } catch {
      setError("Failed to delete selected photos.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/photos/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: [...selected] }),
      });
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "propvault-export.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download selected photos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={toggleSelectMode}>
          {selecting ? "Cancel" : "Select"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative">
            {selecting && (
              <>
                {/* Full-card click target */}
                <button
                  type="button"
                  onClick={() => toggle(photo.id)}
                  aria-label={
                    selected.has(photo.id) ? "Deselect photo" : "Select photo"
                  }
                  className="absolute inset-0 z-20 cursor-pointer rounded-lg"
                />
                {/* Corner indicator */}
                <span
                  className={`pointer-events-none absolute left-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-md border-2 ${
                    selected.has(photo.id)
                      ? "border-[var(--pink)] bg-[var(--pink)] text-white"
                      : "border-white bg-black/40 text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </span>
              </>
            )}
            <div
              className={
                selecting && selected.has(photo.id)
                  ? "rounded-lg ring-2 ring-[var(--pink)]"
                  : undefined
              }
            >
              <PhotoCard
                albumId={albumId}
                photoId={photo.id}
                url={photo.url}
                filename={photo.filename}
                tags={photo.tags}
                canDelete={photo.canDelete}
                uploaderName={photo.uploaderName}
                likeCount={photo.likeCount}
                isLiked={photo.isLiked}
                mediaType={photo.mediaType}
              />
            </div>
          </div>
        ))}
      </div>

      {selecting && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-4 border-t border-[var(--line-2)] bg-[var(--paper)] p-4 shadow-lg">
          <span className="font-[family-name:var(--font-montserrat)] text-sm font-semibold text-[var(--ink)]">
            {selected.size} selected
          </span>
          <span className="text-[var(--ink-3)]">·</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={busy}
          >
            <Download className="h-4 w-4" />
            Download Selected
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-center text-sm text-[var(--destructive)]">
          {error}
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected photos</DialogTitle>
            <DialogDescription>
              Permanently delete {selected.size}{" "}
              {selected.size === 1 ? "photo" : "photos"}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={busy}
            >
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
