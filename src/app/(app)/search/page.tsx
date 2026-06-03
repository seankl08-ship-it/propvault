import Link from "next/link";
import { MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPresignedDownloadUrl } from "@/lib/r2";
import { SearchBar } from "@/components/search-bar";

export default async function SearchPage(props: PageProps<"/search">) {
  await auth();

  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  let results: {
    id: string;
    albumId: string;
    url: string;
    filename: string;
    tags: string[];
    uploaderName: string;
    locationName: string | null;
    matchedByLocation: boolean;
    mediaType: string;
  }[] = [];

  if (query) {
    const photos = await db.photo.findMany({
      where: {
        isDeleted: false,
        OR: [
          {
            productTags: {
              some: { code: { contains: query, mode: "insensitive" } },
            },
          },
          { locationName: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { uploadedAt: "desc" },
      include: {
        productTags: true,
        uploadedBy: { select: { name: true, email: true } },
      },
    });

    const lowered = query.toLowerCase();
    results = await Promise.all(
      photos.map(async (photo) => {
        const matchedByLocation =
          photo.locationName?.toLowerCase().includes(lowered) ?? false;
        return {
          id: photo.id,
          albumId: photo.albumId,
          url: await getPresignedDownloadUrl(photo.storageKey),
          filename: photo.originalFilename,
          tags: photo.productTags.map((t) => t.code),
          uploaderName: photo.uploadedBy.name ?? photo.uploadedBy.email,
          locationName: photo.locationName,
          matchedByLocation,
          mediaType: photo.mediaType,
        };
      }),
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
                <div key={photo.id}>
                  <Link
                    href={`/albums/${photo.albumId}/photos/${photo.id}`}
                    className="block overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--muted)]"
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      {photo.mediaType === "video" ? (
                        <video
                          src={photo.url}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.url}
                          alt={photo.filename}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="truncate font-[family-name:var(--font-mukta)] text-[13px] text-[var(--ink-3)]">
                      {photo.uploaderName}
                    </span>
                    {photo.matchedByLocation && photo.locationName && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--bg)] px-2 py-0.5 font-[family-name:var(--font-mukta)] text-[12px] text-[var(--ink-3)]">
                        <MapPin className="h-3 w-3" />
                        {photo.locationName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-sm text-[var(--muted-foreground)]">
              No photos match that product code or location.
            </p>
          )}
        </>
      ) : (
        <p className="mt-12 text-center text-sm text-[var(--muted-foreground)]">
          Enter a product code or location to search.
        </p>
      )}
    </div>
  );
}
