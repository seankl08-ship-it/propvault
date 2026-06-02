import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { CreateAlbumDialog } from "@/components/create-album-dialog";

export default async function AlbumsPage() {
  await auth();

  const albums = await db.album.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      coverPhoto: true,
      _count: {
        select: { photos: { where: { isDeleted: false } } },
      },
    },
  });

  const albumsWithCover = await Promise.all(
    albums.map(async (album) => {
      let coverUrl: string | null = null;
      if (album.coverPhoto && !album.coverPhoto.isDeleted) {
        coverUrl = await getPresignedDownloadUrl(album.coverPhoto.storageKey);
      } else {
        const firstPhoto = await db.photo.findFirst({
          where: { albumId: album.id, isDeleted: false },
          orderBy: { uploadedAt: "asc" },
        });
        if (firstPhoto) {
          coverUrl = await getPresignedDownloadUrl(firstPhoto.storageKey);
        }
      }
      return { ...album, coverUrl };
    }),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Albums</h1>
        <CreateAlbumDialog />
      </div>

      {albumsWithCover.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] py-20 text-center">
          <ImageIcon className="h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            No albums yet. Create your first one.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albumsWithCover.map((album) => (
            <Link
              key={album.id}
              href={`/albums/${album.id}`}
              className="group overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--muted)]">
                {album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-[var(--muted-foreground)]" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="truncate font-medium">{album.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {album._count.photos}{" "}
                  {album._count.photos === 1 ? "photo" : "photos"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
