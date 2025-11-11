import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Base path: /WEBAI/ for GitHub Pages, / for Vercel
// Vercel will override this via environment variable if needed
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/WEBAI/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})

