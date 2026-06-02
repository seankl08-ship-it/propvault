import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const role = (session.user as { role?: string }).role;

  const photo = await db.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const isOwner = photo.uploadedById === session.user.id;
  if (role !== "admin" && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Clear album cover references to this photo so we can delete the row.
  await db.album.updateMany({
    where: { coverPhotoId: id },
    data: { coverPhotoId: null },
  });

  try {
    await deleteFromR2(photo.storageKey);
  } catch (err) {
    console.error("R2 deletion failed (continuing with DB cleanup):", err);
  }
  await db.productTag.deleteMany({ where: { photoId: id } });
  await db.photo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
