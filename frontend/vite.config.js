import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       // always use this port
    strictPort: true, // fail clearly instead of silently jumping to 5174, 5175, etc.
  },
})
