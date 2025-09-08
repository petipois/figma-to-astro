// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
// https://astro.build/config
export default defineConfig({
  integrations:[clerk()],
  output: "server",
  
  vite: {
    plugins: [tailwindcss()],
  },

   adapter: node({
    mode: 'middleware',
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