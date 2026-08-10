import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Production is single-origin (Django serves the built frontend +
    // API from the same host — see the "single-origin deploy" decision
    // in the Phase 1 plan). In dev, Vite proxies /api to the Django dev
    // server so the frontend never needs CORS or a hardcoded API host.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
})