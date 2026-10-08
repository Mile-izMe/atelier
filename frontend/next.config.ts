import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:3001").replace(
  /\/+$/,
  "",
);

const nextConfig: NextConfig = {
  rewrites() {
    return [{ source: "/backend/:path*", destination: `${backendUrl}/:path*` }];
  },
};

export default nextConfig;
