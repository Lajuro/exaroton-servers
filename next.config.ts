import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.exaroton\.com\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "exaroton-api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-storage-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.firebasestorage\.app\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "firebase-storage-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          },
        },
      },
      {
        urlPattern: /\/api\/(servers|account|credits).*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "internal-api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(withPWA(nextConfig));
