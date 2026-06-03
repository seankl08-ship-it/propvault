import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/photos/[id]/like — toggle like for the current user.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const photo = await db.photo.findUnique({ where: { id } });
  if (!photo || photo.isDeleted) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const existing = await db.like.findUnique({
    where: { photoId_userId: { photoId: id, userId } },
  });

  let liked: boolean;
  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await db.like.create({ data: { photoId: id, userId } });
    liked = true;
  }

  const count = await db.like.count({ where: { photoId: id } });

  return NextResponse.json({ liked, count });
}
