import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { UploadPhotosButton } from "@/components/upload-photos-button";
import { PhotoCard } from "@/components/photo-card";

export default async function AlbumDetailPage(props: PageProps<"/albums/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const currentUserId = session?.user?.id;

  const album = await db.album.findUnique({
    where: { id },
    include: {
      photos: {
        where: { isDeleted: false },
        orderBy: { uploadedAt: "desc" },
        include: { productTags: true },
      },
    },
  });

  if (!album) notFound();

  const photos = await Promise.all(
    album.photos.map(async (photo) => ({
      id: photo.id,
      url: await getPresignedDownloadUrl(photo.storageKey),
      filename: photo.originalFilename,
      tags: photo.productTags.map((t) => t.code),
      uploadedById: photo.uploadedById,
    })),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/albums"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to albums
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{album.name}</h1>
          {album.description && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {album.description}
            </p>
          )}
        </div>
        <UploadPhotosButton albumId={album.id} />
      </div>

      {photos.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] py-20 text-center">
          <ImageIcon className="h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            No photos yet. Upload some to get started.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              albumId={album.id}
              photoId={photo.id}
              url={photo.url}
              filename={photo.filename}
              tags={photo.tags}
              canDelete={role === "admin" || photo.uploadedById === currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
