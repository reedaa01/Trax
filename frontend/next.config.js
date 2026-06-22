/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://trax-production-3d14.up.railway.app:8000'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
