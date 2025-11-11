import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/WEBAI-GITHUB/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})

