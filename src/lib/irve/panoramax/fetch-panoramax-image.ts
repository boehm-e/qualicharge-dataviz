import {
  type PanoramaResult,
  type PanoramaxAssets,
  type PanoramaxResponse,
} from "@/types/panoramax";

const BASE_URL = "https://api.panoramax.xyz/api/search";

interface FetchImagesOptions {
  lat: number;
  lon: number;
  /** Bounding box half-size in degrees (~0.001 ≈ 100m) */
  delta?: number;
  limit?: number;
}

function buildBBox(lat: number, lon: number, delta: number): string {
  return [
    lon - delta,
    lat - delta,
    lon + delta,
    lat + delta,
  ].join(",");
}

const ASSET_PRIORITY: readonly string[] = [
  "sd",
  "hd",
  "image",
  "original",
  "default",
  "data",
  "thumb",
];

function extractImageUrl(assets: PanoramaxAssets): string | null {
  for (const key of ASSET_PRIORITY) {
    const asset = assets[key];
    if (asset?.href) {
      return asset.href;
    }
  }
  return null;
}

/**
 * Fetches the first available panorama image URL near the given coordinates.
 * Returns the image URL string, or null if none is found.
 */
export async function fetchPanoramasImage({
  lat,
  lon,
  delta = 0.001,
}: Pick<FetchImagesOptions, "lat" | "lon" | "delta">): Promise<string | null> {
  const panorama = await fetchPanorama({ lat, lon, delta });
  return panorama?.imageUrl ?? null;
}

export async function fetchPanorama({
  lat,
  lon,
  delta = 0.001,
}: Pick<FetchImagesOptions, "lat" | "lon" | "delta">): Promise<PanoramaResult | null> {
  const bbox = buildBBox(lat, lon, delta);
  const url = `${BASE_URL}?bbox=${bbox}&limit=1`;

  const res = await fetch(url);
  const data: PanoramaxResponse = await res.json();

  const feature = data.features?.[0];
  if (!feature) return null;

  const imageUrl = extractImageUrl(feature.assets);
  if (!imageUrl) return null;

  return {
    id: feature.id,
    imageUrl,
    lon: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1],
  };
}
