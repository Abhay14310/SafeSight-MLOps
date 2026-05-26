// vite.config.ts — EcoTrack Client
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/ecotrack/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 3008,
    proxy: {
      '/api': { target: 'http://localhost:5055', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5055', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  define: {
    // In production (Vercel), the API is at /api/ecotrack/*
    'import.meta.env.VITE_API_BASE': JSON.stringify(
      process.env.NODE_ENV === 'production' ? '/api/ecotrack' : '/api'
    ),
  },
});
