import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/format': 'http://localhost:3000',
      '/version': 'http://localhost:3000',
      '/options': 'http://localhost:3000',
      '/defaults': 'http://localhost:3000',
    },
  },
})
