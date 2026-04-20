import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      // Proxy all /public/* requests to the backend — avoids CORS in dev
      '/public': 'http://localhost:3001',
    },
  },
  build: {
    sourcemap: false,
  },
})

