import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { TagInput } from "@/components/tag-input";
import { DeletePhotoButton } from "@/components/delete-photo-button";
import { LikeButton } from "@/components/like-button";
import { CommentsSection } from "@/components/comments-section";
import { buttonVariants } from "@/components/ui/button";

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PhotoDetailPage(
  props: PageProps<"/albums/[id]/photos/[photoId]">,
) {
  const { id, photoId } = await props.params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const currentUserId = session?.user?.id;

  const photo = await db.photo.findUnique({
    where: { id: photoId },
    include: {
      productTags: { orderBy: { code: "asc" } },
      uploadedBy: { select: { name: true, email: true } },
      _count: { select: { likes: true } },
    },
  });

  if (!photo || photo.isDeleted || photo.albumId !== id) notFound();

  const url = await getPresignedDownloadUrl(photo.storageKey);
  const canDelete = role === "admin" || photo.uploadedById === currentUserId;
  const isVideo = photo.mediaType === "video";
  const uploaderName = photo.uploadedBy.name ?? photo.uploadedBy.email;
  const displayDate = formatDate(photo.takenAt ?? photo.uploadedAt);

  const liked = currentUserId
    ? (await db.like.findUnique({
        where: { photoId_userId: { photoId, userId: currentUserId } },
      })) !== null
    : false;

  const commentRows = await db.comment.findMany({
    where: { photoId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const initialComments = commentRows.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    userId: c.userId,
    userName: c.user.name ?? c.user.email,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href={`/albums/${id}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to album
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]">
          {isVideo ? (
            <video src={url} controls className="max-h-[75vh] w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={photo.originalFilename}
              className="max-h-[75vh] w-full object-contain"
            />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="truncate text-lg font-semibold">
              {photo.originalFilename}
            </h1>
            <p className="mt-1 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
              Uploaded by {uploaderName} · {displayDate}
            </p>
            {photo.locationName && (
              <p className="mt-1 inline-flex items-center gap-1 font-[family-name:var(--font-mukta)] text-sm text-[var(--ink-3)]">
                <MapPin className="h-3.5 w-3.5" />
                {photo.locationName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/photos/${photo.id}/download`}
              className={buttonVariants({ variant: "outline", size: "md" })}
            >
              <Download className="h-4 w-4" />
              Download
            </a>
            <LikeButton
              photoId={photo.id}
              initialLiked={liked}
              initialCount={photo._count.likes}
            />
            {canDelete && (
              <DeletePhotoButton
                photoId={photo.id}
                redirectTo={`/albums/${id}`}
              />
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Product codes</h2>
            <TagInput
              photoId={photo.id}
              initialTags={photo.productTags.map((t) => t.code)}
            />
          </div>

          {currentUserId && (
            <CommentsSection
              photoId={photo.id}
              currentUserId={currentUserId}
              isAdmin={role === "admin"}
              initialComments={initialComments}
            />
          )}
        </div>
      </div>
    </div>
  );
}
