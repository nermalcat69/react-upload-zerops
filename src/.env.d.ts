/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORAGE_URL: string
  readonly VITE_ACCESS_KEY: string
  readonly VITE_BUCKET_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 