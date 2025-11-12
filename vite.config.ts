import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

// https://vitejs.dev/config/
// Base path: /WEBAI/ for GitHub Pages, / for Vercel
// Use VITE_BASE_PATH environment variable to override (set to '/' for Vercel)
export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({}),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'Gambar/ChatGPT_Image_Nov_11__2025__07_22_25_AM-removebg-preview.png'],
      manifest: {
        name: 'G Chat - AI Assistant',
        short_name: 'G Chat',
        description: 'AI Programming Assistant powered by GPT-4o and Groq Llama',
        theme_color: '#171717',
        background_color: '#171717',
        display: 'standalone',
        orientation: 'portrait',
        scope: process.env.VITE_BASE_PATH || '/WEBAI/',
        start_url: process.env.VITE_BASE_PATH || '/WEBAI/',
        icons: [
          {
            src: 'Gambar/ChatGPT_Image_Nov_11__2025__07_22_25_AM-removebg-preview.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'Gambar/ChatGPT_Image_Nov_11__2025__07_22_25_AM-removebg-preview.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.(openai|groq)\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  base: process.env.VITE_BASE_PATH || '/WEBAI/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})

