export const config = {
    storageUrl: process.env.VITE_STORAGE_URL,
    accessKey: process.env.VITE_ACCESS_KEY,
    bucketName: process.env.VITE_BUCKET_NAME,
} as const; 