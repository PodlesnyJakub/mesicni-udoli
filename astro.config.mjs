// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://mesicni-udoli.vercel.app',
  security: { checkOrigin: false },
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
