import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    isolate: false,
    pool: 'threads',
  },
  server: {
    port: 3000,
    proxy: {
      '/v1': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/healthz': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
