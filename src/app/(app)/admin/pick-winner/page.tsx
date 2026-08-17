import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { PickWinnerForm } from "@/components/pick-winner-form";

function getPreviousMonthKey(): { key: string; label: string } {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const label = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return { key, label };
}

export default async function PickWinnerPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") redirect("/albums");

  const { key, label } = getPreviousMonthKey();

  const existingWinners = await db.monthlyWinner.findMany({ where: { month: key } });

  const [top10Photos, top10Videos] = await Promise.all([
    db.photo.findMany({
      where: {
        isDeleted: false,
        mediaType: "photo",
        album: { monthYear: key },
      },
      orderBy: { likes: { _count: "desc" } },
      take: 10,
      include: {
        _count: { select: { likes: true } },
        uploadedBy: { select: { name: true, email: true } },
      },
    }),
    db.photo.findMany({
      where: {
        isDeleted: false,
        mediaType: "video",
        album: { monthYear: key },
      },
      orderBy: { likes: { _count: "desc" } },
      take: 10,
      include: {
        _count: { select: { likes: true } },
        uploadedBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  async function toEntries(photos: typeof top10Photos) {
    return Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        url: await getPresignedDownloadUrl(p.storageKey),
        filename: p.originalFilename,
        uploaderName: p.uploadedBy.name ?? p.uploadedBy.email,
        likeCount: p._count.likes,
        mediaType: p.mediaType,
      })),
    );
  }

  const [photoEntries, videoEntries] = await Promise.all([
    toEntries(top10Photos),
    toEntries(top10Videos),
  ]);

  const alreadyPicked = existingWinners.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/hall-of-fame"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Hall of Fame
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <Trophy className="h-6 w-6 text-[var(--orange)]" />
        <div>
          <h1 className="font-[family-name:var(--font-montserrat)] text-[26px] font-extrabold tracking-tight text-[var(--ink)]">
            Pick Winners
          </h1>
          <p className="font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
            {label} · Admin only
          </p>
        </div>
      </div>

      {alreadyPicked ? (
        <div className="mt-8 rounded-xl border border-[var(--orange)]/30 bg-[var(--orange)]/5 px-6 py-8">
          <p className="font-[family-name:var(--font-montserrat)] font-bold text-[var(--ink)]">
            Winners already declared for {label}
          </p>
          <p className="mt-1 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
            {existingWinners.length} winner{existingWinners.length !== 1 ? "s" : ""} recorded.
            View them in the{" "}
            <Link href="/hall-of-fame" className="text-[var(--cyan)] underline underline-offset-2">
              Hall of Fame
            </Link>
            .
          </p>
        </div>
      ) : (
        <PickWinnerForm
          month={key}
          monthLabel={label}
          photos={photoEntries}
          videos={videoEntries}
        />
      )}
    </div>
  );
}
