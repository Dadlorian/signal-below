import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Let the Cloudflare tunnel reach the dev and preview servers by name.
  server: { allowedHosts: ['signal.gamelab.link'] },
  preview: { allowedHosts: ['signal.gamelab.link'] },
  // Build the docs pages alongside the game so the public site serves both.
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        docs: path.resolve(import.meta.dirname, 'docs/index.html'),
        journey: path.resolve(import.meta.dirname, 'docs/hacker-journey.html'),
        manual: path.resolve(import.meta.dirname, 'docs/field-manual.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
});
