import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/mununu-ui/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Fail if port is already in use instead of trying next port
    open: true,
    // Enable source maps for better debugging
    sourcemapIgnoreList: false,
  },
  build: {
    sourcemap: true, // Enable source maps for production debugging
  },
  optimizeDeps: {
    // Force pre-bundling to avoid dynamic import issues
    include: ['monaco-editor'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})

