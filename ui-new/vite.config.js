import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:4533',
      '/api': 'http://localhost:4533',
      '/rest': 'http://localhost:4533',
      '/backgrounds': 'http://localhost:4533',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
