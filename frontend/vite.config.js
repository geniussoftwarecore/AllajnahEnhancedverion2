import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:8000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', '@heroicons/react'],
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'charts': ['recharts'],
          'i18n': ['i18next', 'react-i18next']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    reportCompressedSize: false
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios']
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api')
  }
})
