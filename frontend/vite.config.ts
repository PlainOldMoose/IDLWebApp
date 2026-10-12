import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),
  tailwindcss()],
  // Same paths nginx proxies in prod, so the app is always same-origin
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
    },
  },
  // globals lets Testing Library clean up the DOM after each test
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
