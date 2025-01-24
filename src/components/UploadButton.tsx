import React, { useState, useRef } from 'react';
import { useFiles } from '../context/FileContext';

interface UploadedFile {
    name: string;
    url: string;
    size: string;
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ExternalLinkIcon = () => (
    <svg 
        className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
        />
    </svg>
);

export function UploadButton() {
    const { addFile } = useFiles();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedSize, setUploadedSize] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setUploadedFile(null);
            setUploadProgress(0);
            setUploadedSize(0);
        }
    };

    const constructStorageUrl = (filename: string): string => {
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
        setUploadProgress(0);
        setUploadedSize(0);

        try {
            const uniqueFileName = `${Date.now()}-${file.name}`;
            const url = constructStorageUrl(uniqueFileName);

            // Create XMLHttpRequest for upload with progress
            const xhr = new XMLHttpRequest();
            
            // Setup upload progress handler
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    setUploadProgress(Math.round(progress));
                    setUploadedSize(event.loaded);
                }
            };

            // Create a promise to handle the XHR request
            const uploadPromise = new Promise((resolve, reject) => {
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Upload failed'));
            });

            // Setup and send the request
            xhr.open('PUT', url);
            xhr.setRequestHeader('x-api-key', process.env.ACCESS_KEY || '');
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);

            // Wait for upload to complete
            await uploadPromise;

            const newFile = {
                name: uniqueFileName,
                url: url,
                lastModified: new Date().toLocaleString(),
                size: formatFileSize(file.size)
            };

            addFile(newFile);

            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setUploadedFile({
                name: uniqueFileName,
                url: url,
                size: formatFileSize(file.size)
            });

        } catch (error) {
            console.error('Upload error:', error);
            setError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadedSize(0);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-neutral-600"
                disabled={isUploading}
            />
            {file && !isUploading && !uploadedFile && (
                <div className="text-sm text-neutral-700">
                    Selected file: {file.name} ({formatFileSize(file.size)})
                </div>
            )}
            <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`px-4 py-2 relative ${
                    !file || isUploading 
                        ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed' 
                        : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                }`}
            >
                {isUploading ? (
                    <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>
                                Uploading... {uploadProgress}% 
                                ({formatFileSize(uploadedSize)} of {file ? formatFileSize(file.size) : '0 B'})
                            </span>
                        </div>
                    </div>
                ) : 'Upload'}
            </button>
            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
            {uploadedFile && (
                <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200">
                    <p className="text-neutral-900 mb-2">File uploaded successfully!</p>
                    <p className="text-sm text-neutral-700 mb-1">
                        Filename: {uploadedFile.name}
                        <br />
                        Size: {uploadedFile.size}
                    </p>
                    <a 
                        href={uploadedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-800 hover:text-neutral-900 transition-colors inline-flex items-center"
                    >
                        View uploaded file
                        <ExternalLinkIcon />
                    </a>
                </div>
            )}
        </div>
    );
} 