import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Let the Cloudflare tunnel reach the dev and preview servers by name.
  server: { allowedHosts: ['signal.gamelab.link'] },
  preview: { allowedHosts: ['signal.gamelab.link'] },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
});
