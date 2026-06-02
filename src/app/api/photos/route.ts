import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const albumId = formData.get("albumId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof albumId !== "string" || !albumId) {
    return NextResponse.json({ error: "albumId is required" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: jpeg, png, webp, heic." },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 20MB." },
      { status: 400 },
    );
  }

  const album = await db.album.findUnique({ where: { id: albumId } });
  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const key = `photos/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadToR2(key, buffer, file.type);

  const photo = await db.photo.create({
    data: {
      originalFilename: file.name,
      storageKey: key,
      fileSize: file.size,
      mimeType: file.type,
      albumId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
