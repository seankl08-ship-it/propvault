import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { TagInput } from "@/components/tag-input";
import { DeletePhotoButton } from "@/components/delete-photo-button";
import { buttonVariants } from "@/components/ui/button";

export default async function PhotoDetailPage(
  props: PageProps<"/albums/[id]/photos/[photoId]">,
) {
  const { id, photoId } = await props.params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const currentUserId = session?.user?.id;

  const photo = await db.photo.findUnique({
    where: { id: photoId },
    include: { productTags: { orderBy: { code: "asc" } } },
  });

  if (!photo || photo.isDeleted || photo.albumId !== id) notFound();

  const url = await getPresignedDownloadUrl(photo.storageKey);
  const canDelete = role === "admin" || photo.uploadedById === currentUserId;

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={photo.originalFilename}
            className="max-h-[75vh] w-full object-contain"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="truncate text-lg font-semibold">
              {photo.originalFilename}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/photos/${photo.id}/download`}
              className={buttonVariants({ variant: "outline", size: "md" })}
            >
              <Download className="h-4 w-4" />
              Download
            </a>
            {canDelete && (
              <DeletePhotoButton photoId={photo.id} redirectTo={`/albums/${id}`} />
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-medium">Product codes</h2>
            <TagInput
              photoId={photo.id}
              initialTags={photo.productTags.map((t) => t.code)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
