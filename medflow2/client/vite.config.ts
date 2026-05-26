// vite.config.ts — MedFlow 2 Client
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/medflow/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 3010,
    proxy: {
      '/api': { target: 'http://localhost:5060', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5060', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  define: {
    // In production (Vercel), the API is at /api/medflow2/*
    // In dev, the Vite proxy sends /api/* → localhost:5060
    'import.meta.env.VITE_API_BASE': JSON.stringify(
      process.env.NODE_ENV === 'production' ? '/api/medflow2' : '/api'
    ),
  },
});
