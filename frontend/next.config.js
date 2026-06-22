/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    if (!apiBase) {
      return [];
    }

    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
