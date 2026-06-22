import { ImageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { AlbumCard } from "@/components/album-card";

export default async function AlbumsPage() {
  await auth();

  const albums = await db.album.findMany({
    // Auto-generated month albums sort newest-first; legacy (null monthYear) fall to the end.
    orderBy: [{ monthYear: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: {
      coverPhoto: true,
      _count: {
        select: { photos: { where: { isDeleted: false } } },
      },
    },
  });

  const allAlbumsWithCover = await Promise.all(
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

  // Only show albums that have at least one photo
  const albumsWithCover = allAlbumsWithCover.filter((a) => a._count.photos > 0);

  const totalPhotos = albumsWithCover.reduce(
    (sum, a) => sum + a._count.photos,
    0,
  );

  return (
    <div>
      <div className="flex items-center gap-4 px-7 pb-4 pt-5">
        <div>
          <h1 className="font-[family-name:var(--font-montserrat)] text-[26px] font-extrabold leading-none tracking-tight text-[var(--ink)]">
            All albums
          </h1>
          <p className="mt-1.5 font-[family-name:var(--font-montserrat)] text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
            {albumsWithCover.length}{" "}
            {albumsWithCover.length === 1 ? "album" : "albums"} ·{" "}
            {totalPhotos} {totalPhotos === 1 ? "photo" : "photos"}
          </p>
        </div>
      </div>

      {albumsWithCover.length === 0 ? (
        <div className="mx-7 mb-7 flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[var(--line-2)] py-20 text-center">
          <ImageIcon className="h-10 w-10 text-[var(--ink-3)]" />
          <p className="mt-4 font-[family-name:var(--font-mukta)] text-[15px] text-[var(--ink-3)]">
            No albums yet. Upload photos to get started — albums are created automatically by month.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-[26px] px-7 pb-7 pt-1 lg:grid-cols-4">
          {albumsWithCover.map((album, index) => (
            <AlbumCard
              key={album.id}
              id={album.id}
              name={album.name}
              photoCount={album._count.photos}
              coverUrl={album.coverUrl}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
