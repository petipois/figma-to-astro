import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig } from 'astro/config';

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output:"server",

  vite: {
      plugins: [tailwindcss()],
	},

  adapter: node({
    mode: "standalone",
  }),
});