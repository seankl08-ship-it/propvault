import exifr from "exifr";

export interface MediaMeta {
  takenAt: Date | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
}

const EMPTY: MediaMeta = {
  takenAt: null,
  locationName: null,
  locationLat: null,
  locationLng: null,
};

/**
 * Reverse-geocode a lat/lng to a city/area name using the free Nominatim API.
 * Returns null on any failure — geocoding must never block an upload.
 */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { "User-Agent": "PropVault/1.0" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        suburb?: string;
        county?: string;
      };
    };
    const a = data.address ?? {};
    return a.city ?? a.town ?? a.suburb ?? a.county ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract capture date + GPS location from an image buffer. Videos return nulls.
 * Everything is wrapped in try/catch so metadata extraction never blocks uploads.
 */
export async function extractMediaMeta(
  buffer: Buffer,
  mimeType: string,
): Promise<MediaMeta> {
  if (!mimeType.startsWith("image/")) {
    return { ...EMPTY };
  }

  try {
    const parsed = await exifr.parse(buffer, {
      pick: [
        "DateTimeOriginal",
        "GPSLatitude",
        "GPSLongitude",
        "GPSLatitudeRef",
        "GPSLongitudeRef",
      ],
    });

    if (!parsed) return { ...EMPTY };

    let takenAt: Date | null = null;
    if (parsed.DateTimeOriginal instanceof Date) {
      takenAt = parsed.DateTimeOriginal;
    } else if (parsed.DateTimeOriginal) {
      const d = new Date(parsed.DateTimeOriginal);
      takenAt = isNaN(d.getTime()) ? null : d;
    }

    // exifr's `pick` of GPSLatitude/GPSLongitude returns decimal numbers,
    // already sign-corrected when refs are included in the pick list.
    const lat =
      typeof parsed.GPSLatitude === "number" ? parsed.GPSLatitude : null;
    const lng =
      typeof parsed.GPSLongitude === "number" ? parsed.GPSLongitude : null;

    let locationName: string | null = null;
    if (lat !== null && lng !== null) {
      locationName = await reverseGeocode(lat, lng);
    }

    return {
      takenAt,
      locationName,
      locationLat: lat,
      locationLng: lng,
    };
  } catch {
    return { ...EMPTY };
  }
}
