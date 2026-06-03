import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/nominees — admin nominates a photo for a month.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = (await request.json().catch(() => null)) as {
    photoId?: unknown;
    month?: unknown;
  } | null;
  const photoId = typeof data?.photoId === "string" ? data.photoId : "";
  const month = typeof data?.month === "string" ? data.month : "";

  if (!photoId || !month) {
    return NextResponse.json(
      { error: "photoId and month are required" },
      { status: 400 },
    );
  }

  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo || photo.isDeleted) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const nominee = await db.monthlyNominee.upsert({
    where: { photoId_month: { photoId, month } },
    update: {},
    create: { photoId, month, nominatedById: session.user.id },
  });

  return NextResponse.json(nominee, { status: 201 });
}

// GET /api/nominees?month=2026-06 — list nominees for a month.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month") ?? "";
  if (!month) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  const nominees = await db.monthlyNominee.findMany({
    where: { month },
    orderBy: { nominatedAt: "desc" },
    include: { photo: { include: { productTags: true } } },
  });

  return NextResponse.json({ nominees });
}
