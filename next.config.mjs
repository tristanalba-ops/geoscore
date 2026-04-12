/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // ISR : revalide les pages SEO toutes les 24h
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
    ],
  },
};

export default nextConfig;
