import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_ZIGCHAIN_RPC: process.env.NEXT_PUBLIC_ZIGCHAIN_RPC || 'https://rpc.zigscan.net',
    NEXT_PUBLIC_ZIGCHAIN_CHAIN_ID: process.env.NEXT_PUBLIC_ZIGCHAIN_CHAIN_ID || 'zig-test-2',
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
};

export default nextConfig;