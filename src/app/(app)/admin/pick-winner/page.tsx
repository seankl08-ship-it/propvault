import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Trophy, Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { PickWinnerForm } from "@/components/pick-winner-form";

function getPast6Months(): { key: string; label: string }[] {
  const months = [];
  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    months.push({ key, label });
  }
  return months;
}

export default async function PickWinnerPage(props: PageProps<"/admin/pick-winner">) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") redirect("/albums");

  const searchParams = await props.searchParams;
  const months = getPast6Months();
  const selectedKey = typeof searchParams.month === "string" && months.some(m => m.key === searchParams.month)
    ? searchParams.month
    : months[0].key;
  const selectedMonth = months.find(m => m.key === selectedKey)!;
  const override = searchParams.override === "true";

  // Load existing winners for ALL 6 months (for the tab badges)
  const allWinners = await db.monthlyWinner.findMany({
    where: { month: { in: months.map(m => m.key) } },
    select: { month: true },
  });
  const wonMonths = new Set(allWinners.map(w => w.month));

  // Load top 10 photos and videos for the selected month
  const existingWinners = await db.monthlyWinner.findMany({ where: { month: selectedKey } });

  const [top10Photos, top10Videos] = await Promise.all([
    db.photo.findMany({
      where: { isDeleted: false, mediaType: "photo", album: { monthYear: selectedKey } },
      orderBy: { likes: { _count: "desc" } },
      take: 10,
      include: {
        _count: { select: { likes: true } },
        uploadedBy: { select: { name: true, email: true } },
      },
    }),
    db.photo.findMany({
      where: { isDeleted: false, mediaType: "video", album: { monthYear: selectedKey } },
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

  const alreadyPicked = existingWinners.length > 0 && !override;

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
            Admin only · Select a month below
          </p>
        </div>
      </div>

      {/* Month tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {months.map((m) => {
          const isSelected = m.key === selectedKey;
          const hasPick = wonMonths.has(m.key);
          return (
            <Link
              key={m.key}
              href={`/admin/pick-winner?month=${m.key}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-[family-name:var(--font-montserrat)] text-sm font-semibold transition-colors ${
                isSelected
                  ? "bg-[var(--ink)] text-white"
                  : "border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-2)] hover:bg-[var(--muted)]"
              }`}
            >
              {m.label}
              {hasPick && (
                <Check className={`h-3.5 w-3.5 ${isSelected ? "text-[var(--cyan)]" : "text-[var(--green)]"}`} />
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        {alreadyPicked ? (
          <div className="rounded-xl border border-[var(--orange)]/30 bg-[var(--orange)]/5 px-6 py-8">
            <p className="font-[family-name:var(--font-montserrat)] font-bold text-[var(--ink)]">
              Winners already declared for {selectedMonth.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
              {existingWinners.length} winner{existingWinners.length !== 1 ? "s" : ""} recorded.
              View them in the{" "}
              <Link href="/hall-of-fame" className="text-[var(--cyan)] underline underline-offset-2">
                Hall of Fame
              </Link>
              .
            </p>
            <Link
              href={`/admin/pick-winner?month=${selectedKey}&override=true`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-2 font-[family-name:var(--font-montserrat)] text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--muted)]"
            >
              Change Winners
            </Link>
          </div>
        ) : (
          <PickWinnerForm
            month={selectedKey}
            monthLabel={selectedMonth.label}
            photos={photoEntries}
            videos={videoEntries}
            isOverride={override && existingWinners.length > 0}
          />
        )}
      </div>
    </div>
  );
}
