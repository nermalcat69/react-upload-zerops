import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    define: {
      'process.env.VITE_STORAGE_URL': JSON.stringify(env.VITE_STORAGE_URL),
      'process.env.VITE_ACCESS_KEY': JSON.stringify(env.VITE_ACCESS_KEY),
      'process.env.VITE_BUCKET_NAME': JSON.stringify(env.VITE_BUCKET_NAME),
    }
  }
})
