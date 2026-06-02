import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const photo = await db.photo.findUnique({ where: { id } });
  if (!photo || photo.isDeleted) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const existing = await db.productTag.findFirst({
    where: { photoId: id, code },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const tag = await db.productTag.create({
    data: {
      photoId: id,
      code,
      addedById: session.user.id,
    },
  });

  return NextResponse.json(tag, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code query param is required" }, { status: 400 });
  }

  await db.productTag.deleteMany({
    where: { photoId: id, code },
  });

  return NextResponse.json({ success: true });
}
