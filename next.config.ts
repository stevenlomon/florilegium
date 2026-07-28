import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Whitelist images from the Open Library API!
  images: {
    unoptimized: true, // Forces the browser to fetch images directly. Cut out Vercel as a middle man which is causing a ruccus
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/**', // Allow all image paths from this domain
      },
      // {
      //   protocol: 'https',
      //   hostname: 'via.placeholder.com', // For our fallback image
      //   pathname: '/**',
      // } We're relying only on our own custom image fallback now!
    ],
  },
};

export default nextConfig;
