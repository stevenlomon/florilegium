import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Whitelist images from the Open Library API!
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/**', // Allow all image paths from this domain
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // For our fallback image
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
