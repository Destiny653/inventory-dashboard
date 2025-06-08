import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // configure this imagee here "images.unsplash.com"
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
