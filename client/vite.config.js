import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill for @react-pdf/renderer which uses Node's `global` and `Buffer`
    global: 'globalThis',
  },
  build: {
    // Raise the warning threshold — the pdf-vendor chunk is large by nature (~1.2 MB)
    // but it is only loaded when the user navigates to an invoice/quotation route.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Isolate @react-pdf/renderer and its dependencies into a dedicated chunk
          // so it is never included in the initial app bundle.
          if (id.includes('@react-pdf') || id.includes('pdf-lib') || id.includes('fontkit') || id.includes('restructure')) {
            return 'pdf-vendor';
          }
          // Group other large vendor libs together
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
