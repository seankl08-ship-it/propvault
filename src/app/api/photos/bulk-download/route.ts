import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { r2 } from "@/lib/r2";

function extFromKey(key: string): string {
  const idx = key.lastIndexOf(".");
  return idx >= 0 ? key.slice(idx + 1) : "bin";
}

// POST /api/photos/bulk-download — bundle selected photos into a zip.
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

  const photos = await db.photo.findMany({
    where: { id: { in: photoIds }, isDeleted: false },
    include: { productTags: true },
  });

  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos found" }, { status: 404 });
  }

  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const photo of photos) {
    const ext = extFromKey(photo.storageKey);
    const codes = photo.productTags.map((t) => t.code).sort();
    const base = codes.length > 0 ? codes.join(",") : `untitled_${photo.id}`;

    let filename = `${base}.${ext}`;
    const count = usedNames.get(filename) ?? 0;
    if (count > 0) {
      filename = `${base}_${count}.${ext}`;
    }
    usedNames.set(`${base}.${ext}`, count + 1);

    try {
      const result = await r2.send(
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME ?? "",
          Key: photo.storageKey,
        }),
      );
      if (!result.Body) continue;
      const bytes = await result.Body.transformToByteArray();
      zip.file(filename, bytes);
    } catch (err) {
      console.error("Failed to add photo to zip:", photo.id, err);
    }
  }

  const content = await zip.generateAsync({ type: "arraybuffer" });

  return new Response(content, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="propvault-export.zip"',
    },
  });
}
