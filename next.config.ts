import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const repo = 'qualicharge-dataviz';
const basePath = isProd ? `/${repo}` : '';


const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};


export default nextConfig;
