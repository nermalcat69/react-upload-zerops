import React, { useState, useRef } from 'react';

interface UploadedFile {
    name: string;
    url: string;
}

export function UploadButton() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setUploadedFile(null);
        }
    };

    const constructStorageUrl = (filename: string): string => {
        // Add debug logging
        console.log('Environment Variables in UploadButton:', {
            storageUrl: process.env.VITE_STORAGE_URL,
            bucketName: process.env.VITE_BUCKET_NAME,
            hasAccessKey: !!process.env.VITE_ACCESS_KEY
        });

        const storageUrl = process.env.VITE_STORAGE_URL?.replace(/\/$/, '');
        const bucketName = process.env.VITE_BUCKET_NAME;
        
        if (!storageUrl || !bucketName) {
            throw new Error(`Storage configuration is missing:
                Storage URL: ${storageUrl ? 'OK' : 'Missing'}
                Bucket Name: ${bucketName ? 'OK' : 'Missing'}`
            );
        }

        return `${storageUrl}/${bucketName}/${encodeURIComponent(filename)}`;
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setError(null);

        try {
            // Generate unique filename
            const uniqueFileName = `${Date.now()}-${file.name}`;
            const url = constructStorageUrl(uniqueFileName);

            console.log('Uploading to:', url); // Debug log

            // Direct upload to object storage
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'x-api-key': process.env.ACCESS_KEY || '',
                    'Content-Type': file.type,
                },
                body: file
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${errorText}`);
            }

            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setUploadedFile({
                name: uniqueFileName,
                url: url
            });

            console.log('File uploaded successfully:', uniqueFileName);

        } catch (error) {
            console.error('Upload error:', error);
            setError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500"
            />
            <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`px-4 py-2 ${
                    !file || isUploading 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
                {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
            {uploadedFile && (
                <div className="mt-4 p-4 bg-green-50">
                    <p className="text-green-600 mb-2">File uploaded successfully!</p>
                    <p className="text-sm text-gray-600 mb-1">Filename: {uploadedFile.name}</p>
                    <a 
                        href={uploadedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 underline text-sm"
                    >
                        View uploaded file
                    </a>
                </div>
            )}
        </div>
    );
} 