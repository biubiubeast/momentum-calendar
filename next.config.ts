import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  skipTrailingSlashRedirect: true,
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
