/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Image Docker slim : .next/standalone + server.js (cf. Dockerfile).
  output: 'standalone',
};

export default nextConfig;