import Link from "next/link";
import { ImageIcon } from "lucide-react";

const COVER_COLORS = [
  "var(--pink)",
  "var(--cyan)",
  "var(--green)",
  "var(--orange)",
  "var(--purple)",
];

interface AlbumCardProps {
  id: string;
  name: string;
  photoCount: number;
  coverUrl: string | null;
  index: number;
}

export function AlbumCard({
  id,
  name,
  photoCount,
  coverUrl,
  index,
}: AlbumCardProps) {
  const color = COVER_COLORS[index % COVER_COLORS.length];

  return (
    <Link href={`/albums/${id}`} className="group block">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-[13px] md:rounded-[13px]"
        style={{
          background: coverUrl ? undefined : color,
          backgroundImage: coverUrl
            ? undefined
            : "radial-gradient(rgba(255,255,255,0.25) 1.4px, transparent 1.4px)",
          backgroundSize: coverUrl ? undefined : "16px 16px",
        }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-9 w-9 text-white/55" />
          </div>
        )}
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/[0.92] px-2.5 py-1 font-[family-name:var(--font-montserrat)] text-[12px] font-bold text-[var(--ink)]">
          {photoCount} {photoCount === 1 ? "post" : "posts"}
        </span>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="truncate font-[family-name:var(--font-mukta)] text-[15px] font-semibold text-[var(--ink)]">
          {name}
        </span>
        <span className="shrink-0 font-[family-name:var(--font-mukta)] text-[13px] font-medium text-[var(--ink-3)]">
          {photoCount}
        </span>
      </div>
    </Link>
  );
}
