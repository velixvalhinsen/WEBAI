import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Base path: /WEBAI/ for GitHub Pages, / for Vercel
// Use VITE_BASE_PATH environment variable to override (set to '/' for Vercel)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/WEBAI/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})

