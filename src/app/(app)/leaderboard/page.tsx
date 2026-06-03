import Link from "next/link";
import { MapPin, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { NominateButton } from "@/components/nominate-button";

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface Entry {
  id: string;
  albumId: string;
  url: string;
  filename: string;
  uploaderName: string;
  uploaderId: string;
  likeCount: number;
  locationName: string | null;
  mediaType: string;
  nominated: boolean;
  ineligible: boolean;
}

export default async function LeaderboardPage() {
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const month = currentMonthKey();

  // Window for the current month.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [recentWinners, nominees, photos] = await Promise.all([
    db.monthlyWinner.findMany({
      where: { pickedAt: { gte: sixMonthsAgo } },
      include: { photo: { select: { uploadedById: true } } },
    }),
    db.monthlyNominee.findMany({ where: { month }, select: { photoId: true } }),
    db.photo.findMany({
      where: {
        isDeleted: false,
        uploadedAt: { gte: monthStart, lt: monthEnd },
      },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        _count: { select: { likes: true } },
      },
    }),
  ]);

  const ineligibleUserIds = new Set(
    recentWinners.map((w) => w.photo.uploadedById),
  );
  const nominatedIds = new Set(nominees.map((n) => n.photoId));

  async function toEntry(photo: (typeof photos)[number]): Promise<Entry> {
    return {
      id: photo.id,
      albumId: photo.albumId,
      url: await getPresignedDownloadUrl(photo.storageKey),
      filename: photo.originalFilename,
      uploaderName: photo.uploadedBy.name ?? photo.uploadedBy.email,
      uploaderId: photo.uploadedById,
      likeCount: photo._count.likes,
      locationName: photo.locationName,
      mediaType: photo.mediaType,
      nominated: nominatedIds.has(photo.id),
      ineligible: ineligibleUserIds.has(photo.uploadedById),
    };
  }

  const sorted = [...photos].sort(
    (a, b) => b._count.likes - a._count.likes,
  );
  const topPhotos = await Promise.all(
    sorted.filter((p) => p.mediaType !== "video").slice(0, 10).map(toEntry),
  );
  const topVideos = await Promise.all(
    sorted.filter((p) => p.mediaType === "video").slice(0, 10).map(toEntry),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-[var(--pink)]" />
        <h1 className="font-[family-name:var(--font-montserrat)] text-[26px] font-extrabold tracking-tight text-[var(--ink)]">
          Top Liked
        </h1>
      </div>
      <p className="mt-1 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
        This month&rsquo;s most-liked photos and videos.
      </p>

      <LeaderboardSection
        title="Top Photos"
        entries={topPhotos}
        month={month}
        isAdmin={isAdmin}
      />
      <LeaderboardSection
        title="Top Videos"
        entries={topVideos}
        month={month}
        isAdmin={isAdmin}
      />
    </div>
  );
}

function LeaderboardSection({
  title,
  entries,
  month,
  isAdmin,
}: {
  title: string;
  entries: Entry[];
  month: string;
  isAdmin: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-[family-name:var(--font-montserrat)] text-lg font-bold text-[var(--ink)]">
        {title}
      </h2>
      {entries.length === 0 ? (
        <p className="font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
          Nothing here yet this month.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry, i) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--line-2)] p-2"
            >
              <span className="w-6 shrink-0 text-center font-[family-name:var(--font-montserrat)] text-sm font-bold text-[var(--ink-3)]">
                {i + 1}
              </span>
              <Link
                href={`/albums/${entry.albumId}/photos/${entry.id}`}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--muted)]"
              >
                {entry.mediaType === "video" ? (
                  <video src={entry.url} className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.url}
                    alt={entry.filename}
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate font-[family-name:var(--font-mukta)] text-sm font-semibold text-[var(--ink)]">
                  {entry.uploaderName}
                </p>
                <div className="flex items-center gap-2 font-[family-name:var(--font-mukta)] text-[13px] text-[var(--ink-3)]">
                  <span>{entry.likeCount} likes</span>
                  {entry.locationName && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />
                      {entry.locationName}
                    </span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="shrink-0">
                  {entry.ineligible ? (
                    <span className="rounded-full bg-[var(--bg)] px-2.5 py-1 font-[family-name:var(--font-montserrat)] text-xs font-semibold text-[var(--ink-3)]">
                      Ineligible
                    </span>
                  ) : (
                    <NominateButton
                      photoId={entry.id}
                      month={month}
                      alreadyNominated={entry.nominated}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
