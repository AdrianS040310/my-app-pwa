import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        'firebase-messaging-sw': './public/firebase-messaging-sw.js'
      }
    }
  },
  publicDir: 'public',
})
