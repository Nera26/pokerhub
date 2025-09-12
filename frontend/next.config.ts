import withPWA from 'next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ⛔ Remove deprecated swcMinify (Next 15 ignores it)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      '@fortawesome/free-solid-svg-icons',
      '@tanstack/react-query',
    ],
  },
  env: {
    NEXT_PUBLIC_SOCKET_URL:
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  swSrc: 'sw.ts',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

let withBundleAnalyzer = (config: NextConfig) => config;
try {
  const bundleAnalyzer = require('@next/bundle-analyzer');
  withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
    analyzerMode: 'json',
  });
} catch {
  // ignore if bundle analyzer isn't installed
}

export default withBundleAnalyzer(withNextIntl(withPWAConfig(nextConfig)));
