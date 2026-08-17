import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import { extractMediaMeta } from "@/lib/exif";
import { getOrCreateMonthAlbum } from "@/lib/albums";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/mov": "mov",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isVideo = file.type in VIDEO_TYPES;
  const ext = IMAGE_TYPES[file.type] ?? VIDEO_TYPES[file.type];

  if (!ext) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Allowed: jpeg, png, webp, heic, mp4, mov.",
      },
      { status: 400 },
    );
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      {
        error: isVideo
          ? "File too large. Maximum size is 200MB."
          : "File too large. Maximum size is 20MB.",
      },
      { status: 400 },
    );
  }

  const mediaType = isVideo ? "video" : "photo";
  const key = `photos/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadToR2(key, buffer, file.type);

  // Extract EXIF metadata (date + location). Never blocks the upload.
  const meta = await extractMediaMeta(buffer, file.type);

  // Determine the album from the capture date (falls back to now).
  const date = meta.takenAt ?? new Date();
  const album = await getOrCreateMonthAlbum(date, db);

  const photo = await db.photo.create({
    data: {
      originalFilename: file.name,
      storageKey: key,
      fileSize: file.size,
      mimeType: file.type,
      albumId: album.id,
      uploadedById: session.user.id,
      mediaType,
      takenAt: meta.takenAt,
      locationName: meta.locationName,
      locationLat: meta.locationLat,
      locationLng: meta.locationLng,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}

// GET /api/photos?q=xxx — search by product tag code OR location name.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const photos = await db.photo.findMany({
    where: {
      isDeleted: false,
      OR: [
        {
          productTags: {
            some: { code: { contains: q, mode: "insensitive" } },
          },
        },
        { locationName: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { uploadedAt: "desc" },
    include: {
      productTags: true,
      uploadedBy: { select: { name: true, email: true } },
    },
  });

  const results = photos.map((p) => ({
    id: p.id,
    albumId: p.albumId,
    filename: p.originalFilename,
    tags: p.productTags.map((t) => t.code),
    locationName: p.locationName,
    mediaType: p.mediaType,
    uploaderName: p.uploadedBy.name ?? p.uploadedBy.email,
  }));

  return NextResponse.json({ results });
}
