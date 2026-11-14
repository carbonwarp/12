import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  build: {
    assets: 'assets',
    inlineStylesheets: 'never',
  },
  vite: { plugins: [tailwindcss()] }
});
