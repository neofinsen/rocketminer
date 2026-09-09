import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: '/rocketminer/',
  root: 'github-pages',
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    emptyOutDir: true,
    outDir: '../pages-dist',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
