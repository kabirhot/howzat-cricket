import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Allows clean imports like '@/context/scoringReducer' instead of '../../context/scoringReducer'
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Cleans up output by ensuring small asset chunks are systematically handled
    chunkSizeWarningLimit: 600,
    sourcemap: false, // Disables sourcemaps for faster, lighter production builds
  },
})
