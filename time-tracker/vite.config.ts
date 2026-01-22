import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envDir: '..',  // Look for .env in parent directory (monorepo root)
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'handsontable-vendor': ['handsontable'],
          'recharts-vendor': ['recharts'],
          'lucide-vendor': ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})