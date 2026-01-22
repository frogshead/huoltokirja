import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// API proxy target: use app:8000 in Docker, localhost:8000 locally
const apiTarget = process.env.API_URL || 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
