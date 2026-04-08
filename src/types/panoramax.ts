export interface PanoramaxAsset {
  href: string;
  type?: string;
  [key: string]: unknown;
}

export interface PanoramaxAssets {
  [key: string]: PanoramaxAsset | undefined;
}

export interface PanoramaxFeature {
  id: string;
  geometry: {
    type: string;
    coordinates: [number, number, ...number[]];
  };
  assets: PanoramaxAssets;
  properties?: Record<string, unknown>;
}

export interface PanoramaxResponse {
  type?: string;
  features?: PanoramaxFeature[];
  links?: Array<{
    rel: string;
    href: string;
    [key: string]: unknown;
  }>;
}

export interface PanoramaResult {
  id: string;
  imageUrl: string;
  lon: number;
  lat: number;
}
