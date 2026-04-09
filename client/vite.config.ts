import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const envDir = fileURLToPath(new URL('../', import.meta.url))

export default defineConfig(({ mode }) => {
  const { PORT = '4000', WEB_PORT = '5174' } = loadEnv(mode, envDir, '')
  const proxy = { '/api': { target: `http://127.0.0.1:${PORT}` } }

  return {
    envDir,
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { host: '127.0.0.1', port: Number(WEB_PORT), strictPort: true, proxy },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy },
    build: { rollupOptions: { output: { manualChunks: { charts: ['recharts'] } } } },
  }
})
