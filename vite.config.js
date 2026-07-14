import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist'
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})
