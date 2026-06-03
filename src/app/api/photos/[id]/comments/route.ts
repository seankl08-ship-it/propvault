import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/photos/[id]/comments — list comments with user names.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const comments = await db.comment.findMany({
    where: { photoId: id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      userId: c.userId,
      userName: c.user.name ?? c.user.email,
    })),
  });
}

// POST /api/photos/[id]/comments — create a comment.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = (await request.json().catch(() => null)) as {
    body?: unknown;
  } | null;
  const body = typeof data?.body === "string" ? data.body.trim() : "";

  if (!body) {
    return NextResponse.json({ error: "Comment body required" }, { status: 400 });
  }

  const photo = await db.photo.findUnique({ where: { id } });
  if (!photo || photo.isDeleted) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const comment = await db.comment.create({
    data: { photoId: id, userId: session.user.id, body },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(
    {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      userId: comment.userId,
      userName: comment.user.name ?? comment.user.email,
    },
    { status: 201 },
  );
}

// DELETE /api/photos/[id]/comments?commentId=xxx — delete own comment (or any, if admin).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params;
  const commentId = request.nextUrl.searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "commentId required" }, { status: 400 });
  }

  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const role = (session.user as { role?: string }).role;
  const isOwner = comment.userId === session.user.id;
  if (role !== "admin" && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.comment.delete({ where: { id: commentId } });

  return NextResponse.json({ success: true });
}
