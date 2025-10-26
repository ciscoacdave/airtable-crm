import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // Keep same directory
    lib: {
      entry: 'src/web-component.js',
      name: 'AirtableCRM',
      fileName: 'airtable-crm-component',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        // Put component files in root of dist, not in assets folder
        assetFileNames: '[name].[ext]',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      }
    },
    // Don't empty the dist directory (so it doesn't delete index.html)
    emptyOutDir: false
  }
})