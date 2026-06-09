import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  plugins: [
    laravel({
      input: ['src/main.jsx'],
      refresh: true,
    }),
    react(),
  ],
})
