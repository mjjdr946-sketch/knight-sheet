/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Image Docker slim : .next/standalone + server.js (cf. Dockerfile).
  output: 'standalone',
  experimental: {
    // better-sqlite3 (it. 10) est un module NATIF (.node) : s'il est bundlé par
    // webpack, le handler /api/* fait tomber le process (crash constaté en prod).
    // On le laisse en `require` externe, résolu depuis node_modules.
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
