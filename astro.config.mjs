// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  output: "server",
  
  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel({
    // Vercel serverless configuration options
    webAnalytics: {
      enabled: true,
    },
    maxDuration: 30,
  }),

  // Security headers for production
  security: {
    checkOrigin: true,
  },

  // Build configuration
  build: {
    inlineStylesheets: "auto",
  },

  // Prefetch configuration for better performance
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
});