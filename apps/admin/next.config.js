/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.bb.vedhitek.com';

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || BACKEND_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Bistro Brain Admin',
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${BACKEND_URL}/api/v1/:path*` },
    ];
  },
};

module.exports = nextConfig;
