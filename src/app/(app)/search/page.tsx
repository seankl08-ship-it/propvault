import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { PhotoCard } from "@/components/photo-card";
import { SearchBar } from "@/components/search-bar";

export default async function SearchPage(props: PageProps<"/search">) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const currentUserId = session?.user?.id;

  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  let results: {
    id: string;
    albumId: string;
    url: string;
    filename: string;
    tags: string[];
    uploadedById: string;
  }[] = [];

  if (query) {
    const photos = await db.photo.findMany({
      where: {
        isDeleted: false,
        productTags: {
          some: { code: { contains: query, mode: "insensitive" } },
        },
      },
      orderBy: { uploadedAt: "desc" },
      include: { productTags: true },
    });

    results = await Promise.all(
      photos.map(async (photo) => ({
        id: photo.id,
        albumId: photo.albumId,
        url: await getPresignedDownloadUrl(photo.storageKey),
        filename: photo.originalFilename,
        tags: photo.productTags.map((t) => t.code),
        uploadedById: photo.uploadedById,
      })),
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <div className="mt-4 md:hidden">
        <SearchBar />
      </div>

      {query ? (
        <>
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <span className="font-medium text-[var(--foreground)]">{query}</span>
          </p>
          {results.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {results.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  albumId={photo.albumId}
                  photoId={photo.id}
                  url={photo.url}
                  filename={photo.filename}
                  tags={photo.tags}
                  canDelete={role === "admin" || photo.uploadedById === currentUserId}
                />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-sm text-[var(--muted-foreground)]">
              No photos match that product code.
            </p>
          )}
        </>
      ) : (
        <p className="mt-12 text-center text-sm text-[var(--muted-foreground)]">
          Enter a product code to search.
        </p>
      )}
    </div>
  );
}
