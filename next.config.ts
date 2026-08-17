import type { NextConfig } from "next";

// Deployed under a subfolder (e.g. https://plinetpierias.gr/youtube-bookmarks).
// Set NEXT_PUBLIC_BASE_PATH at build time to that path (e.g. "/youtube-bookmarks").
// Leave unset for a root-level deployment.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
    ],
    qualities: [25, 50, 75, 100],
  },
};

export default nextConfig;