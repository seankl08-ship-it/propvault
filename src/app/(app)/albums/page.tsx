import { ImageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { CreateAlbumDialog } from "@/components/create-album-dialog";
import { AlbumCard } from "@/components/album-card";

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
        <div className="ml-auto">
          <CreateAlbumDialog />
        </div>
      </div>

      {albumsWithCover.length === 0 ? (
        <div className="mx-7 mb-7 flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[var(--line-2)] py-20 text-center">
          <ImageIcon className="h-10 w-10 text-[var(--ink-3)]" />
          <p className="mt-4 font-[family-name:var(--font-mukta)] text-[15px] text-[var(--ink-3)]">
            No albums yet. Create your first one.
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
