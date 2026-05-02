import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/overpass': {
        target: 'https://overpass-api.de',
        changeOrigin: true,
        rewrite: () => '/api/interpreter',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — loaded first, cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase — shared across all pages
          'vendor-supabase': ['@supabase/supabase-js'],
          // Leaflet map — only needed on /plaetze
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
})
