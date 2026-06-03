import Link from "next/link";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  const idx = Number(month) - 1;
  if (idx < 0 || idx > 11 || !year) return key;
  return `${MONTH_NAMES[idx]} ${year}`;
}

export default async function HallOfFamePage() {
  await auth();

  const winners = await db.monthlyWinner.findMany({
    orderBy: { pickedAt: "desc" },
    take: 6,
    include: {
      photo: {
        include: {
          uploadedBy: { select: { name: true, email: true } },
        },
      },
    },
  });

  const entries = await Promise.all(
    winners.map(async (w) => ({
      id: w.id,
      photoId: w.photoId,
      albumId: w.photo.albumId,
      url: await getPresignedDownloadUrl(w.photo.storageKey),
      filename: w.photo.originalFilename,
      mediaType: w.photo.mediaType,
      winnerName: w.photo.uploadedBy.name ?? w.photo.uploadedBy.email,
      month: formatMonth(w.month),
      category: w.category,
    })),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 text-[var(--pink)]" fill="var(--pink)" />
        <h1 className="font-[family-name:var(--font-montserrat)] text-[26px] font-extrabold tracking-tight text-[var(--ink)]">
          Hall of Fame
        </h1>
      </div>
      <p className="mt-1 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
        Recent monthly winners.
      </p>

      {entries.length === 0 ? (
        <p className="mt-12 text-center font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
          No winners yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/albums/${entry.albumId}/photos/${entry.photoId}`}
              className="group block overflow-hidden rounded-[14px] border border-[var(--line-2)]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--muted)]">
                {entry.mediaType === "video" ? (
                  <video
                    src={entry.url}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.url}
                    alt={entry.filename}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-[0.08em] text-[var(--pink)]">
                  {entry.category === "video"
                    ? "Video of the Month"
                    : "Photo of the Month"}
                </p>
                <p className="mt-1 font-[family-name:var(--font-mukta)] text-[15px] font-semibold text-[var(--ink)]">
                  {entry.winnerName}
                </p>
                <p className="font-[family-name:var(--font-mukta)] text-[13px] text-[var(--ink-3)]">
                  {entry.month}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
