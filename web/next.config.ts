import type { NextConfig } from "next";

// API requests are handled by the route handler in `src/app/api/v1`.
// Keeping the proxy inside Next lets the same relative URLs work locally and
// on Vercel, without publishing a localhost rewrite in production.
const nextConfig: NextConfig = {};

export default nextConfig;
