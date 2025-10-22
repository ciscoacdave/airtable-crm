import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-html',
      closeBundle() {
        copyFileSync('public/index.html', 'dist/index.html')
      }
    }
  ],
  build: {
    lib: {
      entry: 'src/web-component.jsx',
      name: 'AirtableCRM',
      fileName: 'airtable-crm',
      formats: ['es']
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})