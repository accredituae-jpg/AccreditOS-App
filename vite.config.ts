import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "placeholder.svg"],
      manifest: {
        name: "AccreditOS ERP",
        short_name: "AccreditOS",
        description: "AccreditOS - Enterprise Safety & Training ERP System",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        categories: ["business", "productivity", "utilities"],
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,docx,pdf,woff,woff2}"],
        runtimeCaching: [
          // 1. CRITICAL ERP RESTRICTION: Financials, Certificates, Payroll, Auth must be NetworkOnly
          {
            urlPattern:
              /^\/api\/v1\/(billing|certificates|payroll|auth|users|permissions)/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "erp-network-only",
            },
          },
          // 2. Reference & Master Data (Courses, Training Categories): StaleWhileRevalidate
          {
            urlPattern: /^\/api\/v1\/(courses|categories|settings|reference)/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "erp-reference-data",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 3. Google Fonts & Static Assets: CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 4. Static Images: CacheFirst with LRU Eviction
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("radix-ui") ||
              id.includes("framer-motion") ||
              id.includes("lucide-react") ||
              id.includes("tanstack")
            ) {
              return "vendor-react";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (
              id.includes("pdf-lib") ||
              id.includes("jspdf") ||
              id.includes("html2canvas") ||
              id.includes("pizzip")
            ) {
              return "vendor-pdf";
            }
          }
        },
      },
    },
  },
}));
