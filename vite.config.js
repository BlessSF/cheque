import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// viteSingleFile inlines JS/CSS so dist/index.html opens straight from disk (no server needed).
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
})
