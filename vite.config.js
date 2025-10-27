import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/web-component.js',
      name: 'AirtableCRM',
      fileName: 'airtable-crm-component',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: '[name].[ext]',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      }
    }
  }
})