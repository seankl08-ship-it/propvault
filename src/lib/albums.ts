import type { PrismaClient, Album } from "@/generated/prisma/client";

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

/**
 * Get (or lazily create) the auto-generated album for the month of `date`.
 * Albums are keyed by `monthYear` (e.g. "2026-06") and named like "June 2026".
 */
export async function getOrCreateMonthAlbum(
  date: Date,
  db: PrismaClient,
): Promise<Album> {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const monthYear = `${year}-${String(month + 1).padStart(2, "0")}`;
  const name = `${MONTH_NAMES[month]} ${year}`;

  // The system "owner" of auto-albums: fall back to the first admin user.
  const admin = await db.user.findFirst({ where: { role: "admin" } });
  const createdById = admin?.id ?? "system";

  return db.album.upsert({
    where: { monthYear },
    update: {},
    create: {
      name,
      monthYear,
      createdById,
    },
  });
}
