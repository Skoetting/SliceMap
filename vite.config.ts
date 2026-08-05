import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: /SliceMap/
// Docker / local root serve: set VITE_BASE=/
const base = process.env.VITE_BASE ?? '/SliceMap/'

export default defineConfig({
  plugins: [react()],
  base,
})
