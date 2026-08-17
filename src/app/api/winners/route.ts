import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/winners — admin records a monthly winner (with 6-month ineligibility check).
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
    category?: unknown;
    notes?: unknown;
  } | null;
  const photoId = typeof data?.photoId === "string" ? data.photoId : "";
  const month = typeof data?.month === "string" ? data.month : "";
  const category = typeof data?.category === "string" ? data.category : "";
  const notes = typeof data?.notes === "string" ? data.notes : null;

  if (!photoId || !month || !category) {
    return NextResponse.json(
      { error: "photoId, month and category are required" },
      { status: 400 },
    );
  }

  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo || photo.isDeleted) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Check if the uploader won within the past 6 months.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentWin = await db.monthlyWinner.findFirst({
    where: {
      pickedAt: { gte: sixMonthsAgo },
      photo: { uploadedById: photo.uploadedById },
    },
  });
  if (recentWin) {
    return NextResponse.json(
      { error: "User won within the past 6 months" },
      { status: 409 },
    );
  }

  const winner = await db.monthlyWinner.create({
    data: {
      photoId,
      month,
      category,
      notes,
      pickedById: session.user.id,
    },
  });

  return NextResponse.json(winner, { status: 201 });
}

// DELETE /api/winners?month=2026-07 — admin clears all winners for a month.
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? "";
  if (!month) {
    return NextResponse.json({ error: "month is required" }, { status: 400 });
  }

  await db.monthlyWinner.deleteMany({ where: { month } });

  return NextResponse.json({ ok: true });
}

// GET /api/winners — list all winners.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const winners = await db.monthlyWinner.findMany({
    orderBy: { pickedAt: "desc" },
    include: {
      photo: {
        include: {
          uploadedBy: { select: { name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({ winners });
}
