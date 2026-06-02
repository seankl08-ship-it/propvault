import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { r2 } from "@/lib/r2";

function extFromKey(key: string): string {
  const idx = key.lastIndexOf(".");
  return idx >= 0 ? key.slice(idx + 1) : "bin";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const photo = await db.photo.findUnique({
    where: { id },
    include: { productTags: true },
  });

  if (!photo || photo.isDeleted) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const ext = extFromKey(photo.storageKey);
  const codes = photo.productTags.map((t) => t.code).sort();
  const base =
    codes.length > 0 ? codes.join(",") : `untitled_${photo.id}`;
  const filename = `${base}.${ext}`;

  const result = await r2.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME ?? "",
      Key: photo.storageKey,
    }),
  );

  if (!result.Body) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }

  const stream = result.Body.transformToWebStream();

  return new Response(stream, {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
