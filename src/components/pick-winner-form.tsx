"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaEntry {
  id: string;
  url: string;
  filename: string;
  uploaderName: string;
  likeCount: number;
  mediaType: string;
}

interface PickWinnerFormProps {
  month: string;
  monthLabel: string;
  photos: MediaEntry[];
  videos: MediaEntry[];
}

function MediaCard({
  entry,
  selected,
  onSelect,
}: {
  entry: MediaEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-xl border-2 text-left transition-all ${
        selected
          ? "border-[var(--cyan)] shadow-[0_0_0_3px_rgba(0,174,239,0.25)]"
          : "border-[var(--line-2)] hover:border-[var(--cyan)]/50"
      }`}
    >
      <div className="aspect-square w-full overflow-hidden bg-[var(--muted)]">
        {entry.mediaType === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={entry.url} className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.url}
            alt={entry.filename}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        )}
      </div>

      {selected && (
        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cyan)]">
          <Check className="h-3.5 w-3.5 text-white" />
        </span>
      )}

      <div className="p-2">
        <p className="truncate font-[family-name:var(--font-mukta)] text-[13px] font-semibold text-[var(--ink)]">
          {entry.uploaderName}
        </p>
        <p className="inline-flex items-center gap-1 font-[family-name:var(--font-mukta)] text-[12px] text-[var(--ink-3)]">
          <Heart className="h-3 w-3" />
          {entry.likeCount} {entry.likeCount === 1 ? "like" : "likes"}
        </p>
      </div>
    </button>
  );
}

export function PickWinnerForm({ month, monthLabel, photos, videos }: PickWinnerFormProps) {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = selectedPhoto !== null || selectedVideo !== null;

  async function declareWinners() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);

    try {
      const picks: { photoId: string; category: string }[] = [];
      if (selectedPhoto) picks.push({ photoId: selectedPhoto, category: "photo" });
      if (selectedVideo) picks.push({ photoId: selectedVideo, category: "video" });

      for (const pick of picks) {
        const res = await fetch("/api/winners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: pick.photoId, month, category: pick.category }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Failed to save winner");
        }
      }

      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-12 flex flex-col items-center gap-3 rounded-xl border border-[var(--cyan)]/30 bg-[var(--cyan)]/5 px-6 py-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--cyan)]">
          <Check className="h-6 w-6 text-white" />
        </span>
        <p className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-[var(--ink)]">
          Winners declared for {monthLabel}!
        </p>
        <p className="font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
          They&apos;ll appear in the Hall of Fame.
        </p>
        <Button variant="outline" onClick={() => router.push("/hall-of-fame")} className="mt-2">
          View Hall of Fame
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-10">
      {/* Photos */}
      <section>
        <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-[var(--ink)]">
          Photo of the Month
        </h2>
        <p className="mt-0.5 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
          Top {photos.length} most-liked photos from {monthLabel}. Click to select.
        </p>
        {photos.length === 0 ? (
          <p className="mt-6 text-center font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
            No photos uploaded last month.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((p) => (
              <MediaCard
                key={p.id}
                entry={p}
                selected={selectedPhoto === p.id}
                onSelect={() => setSelectedPhoto(selectedPhoto === p.id ? null : p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Videos */}
      <section>
        <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-[var(--ink)]">
          Video of the Month
        </h2>
        <p className="mt-0.5 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
          Top {videos.length} most-liked videos from {monthLabel}. Click to select.
        </p>
        {videos.length === 0 ? (
          <p className="mt-6 text-center font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
            No videos uploaded last month.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {videos.map((v) => (
              <MediaCard
                key={v.id}
                entry={v}
                selected={selectedVideo === v.id}
                onSelect={() => setSelectedVideo(selectedVideo === v.id ? null : v.id)}
              />
            ))}
          </div>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-[var(--pink)]/10 px-4 py-3 font-[family-name:var(--font-mukta)] text-sm text-[var(--pink)]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 border-t border-[var(--line)] pt-6">
        <Button
          variant="primary"
          onClick={declareWinners}
          disabled={!canSubmit || busy}
          className="min-w-[160px]"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Saving…" : "Declare Winners"}
        </Button>
        {!canSubmit && (
          <p className="font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
            Select at least one photo or video above.
          </p>
        )}
      </div>
    </div>
  );
}
