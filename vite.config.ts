import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer - only in production build
    mode === 'production' && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  base: "./",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          utils: ['zod', 'dompurify'],
        },
      },
    },
    // Enable source maps for better debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
}));
