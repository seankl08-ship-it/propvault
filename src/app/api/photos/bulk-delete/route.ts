import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";

// POST /api/photos/bulk-delete — delete many photos.
// Admins can delete any; regular users only their own.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = (await request.json().catch(() => null)) as {
    photoIds?: unknown;
  } | null;
  const photoIds = Array.isArray(data?.photoIds)
    ? data.photoIds.filter((x): x is string => typeof x === "string")
    : [];

  if (photoIds.length === 0) {
    return NextResponse.json({ error: "No photoIds provided" }, { status: 400 });
  }

  const role = (session.user as { role?: string }).role;
  const userId = session.user.id;

  const photos = await db.photo.findMany({
    where: { id: { in: photoIds } },
  });

  let deleted = 0;
  for (const photo of photos) {
    const isOwner = photo.uploadedById === userId;
    if (role !== "admin" && !isOwner) continue;

    // Clear album cover references so the row can be deleted.
    await db.album.updateMany({
      where: { coverPhotoId: photo.id },
      data: { coverPhotoId: null },
    });

    try {
      await deleteFromR2(photo.storageKey);
    } catch (err) {
      console.error("R2 deletion failed (continuing with DB cleanup):", err);
    }

    await db.productTag.deleteMany({ where: { photoId: photo.id } });
    await db.photo.delete({ where: { id: photo.id } });
    deleted++;
  }

  return NextResponse.json({ deleted });
}
