import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Prioritize runtime environment variables over .env file
  const envVars = {
    VITE_STORAGE_URL: process.env.VITE_STORAGE_URL || env.VITE_STORAGE_URL,
    VITE_ACCESS_KEY: process.env.VITE_ACCESS_KEY || env.VITE_ACCESS_KEY,
    VITE_BUCKET_NAME: process.env.VITE_BUCKET_NAME || env.VITE_BUCKET_NAME,
    VITE_SECRET_KEY: process.env.VITE_SECRET_KEY || env.VITE_SECRET_KEY,
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    define: {
      'process.env.VITE_STORAGE_URL': JSON.stringify(envVars.VITE_STORAGE_URL),
      'process.env.VITE_ACCESS_KEY': JSON.stringify(envVars.VITE_ACCESS_KEY),
      'process.env.VITE_BUCKET_NAME': JSON.stringify(envVars.VITE_BUCKET_NAME),
      'process.env.VITE_SECRET_KEY': JSON.stringify(envVars.VITE_SECRET_KEY)
    }
  }
})
