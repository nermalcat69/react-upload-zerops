import React, { useEffect, useState } from 'react';
import { useFiles } from '../context/FileContext';

interface StorageFile {
    name: string;
    url: string;
    lastModified: string;
    size: string;
}

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

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Convert size string back to bytes for calculations
const sizeToBytes = (sizeStr: string): number => {
    const units = {
        'Bytes': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024
    };
    const [value, unit] = sizeStr.split(' ');
    return parseFloat(value) * units[unit as keyof typeof units];
};

export function Feed() {
    const { files, updateFiles } = useFiles();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Calculate total size
    const totalSize = files.reduce((acc, file) => {
        return acc + sizeToBytes(file.size);
    }, 0);

    const fetchFiles = async () => {
        try {
            const storageUrl = process.env.VITE_STORAGE_URL;
            const bucketName = process.env.VITE_BUCKET_NAME;
            const accessKey = process.env.VITE_ACCESS_KEY;

            if (!storageUrl || !bucketName) {
                throw new Error(`Storage configuration is missing:
                    Storage URL: ${storageUrl ? 'OK' : 'Missing'}
                    Bucket Name: ${bucketName ? 'OK' : 'Missing'}`
                );
            }

            const url = `${storageUrl}/${bucketName}/?list-type=2`;

            const response = await fetch(url, {
                headers: {
                    'x-api-key': accessKey || '',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch files: ${response.status} ${errorText}`);
            }

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const contents = xmlDoc.getElementsByTagName('Contents');

            const fileList: StorageFile[] = Array.from(contents).map(content => {
                const key = content.getElementsByTagName('Key')[0]?.textContent || '';
                const lastModified = content.getElementsByTagName('LastModified')[0]?.textContent || '';
                const size = content.getElementsByTagName('Size')[0]?.textContent || '0';
                const fileUrl = `${storageUrl}/${bucketName}/${key}`;
                
                return {
                    name: key,
                    url: fileUrl,
                    lastModified: new Date(lastModified).toLocaleString(),
                    size: formatFileSize(parseInt(size))
                };
            }).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

            updateFiles(fileList);
        } catch (err) {
            console.error('Error fetching files:', err);
            setError(err instanceof Error ? err.message : 'Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (url: string, filename: string) => {
        if (typeof window === 'undefined') return; // SSR check
        
        try {
            const response = await fetch(url, {
                headers: {
                    'x-api-key': process.env.VITE_ACCESS_KEY || '',
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') { // SSR check
            document.title = "Your Project Name - File Storage";
            fetchFiles();
            const interval = setInterval(fetchFiles, 10000);
            return () => clearInterval(interval);
        }
    }, []);

    if (loading) return (
        <div className="text-center mt-8">
            <div className="inline-block w-8 h-8 border-4 border-neutral-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-neutral-700">Loading files...</p>
        </div>
    );
    
    if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

    return (
        <div className="mt-8 w-full max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">Uploaded Files</h2>
                <div className="text-sm text-neutral-700 bg-neutral-100 px-3 py-1">
                    Total Size: {formatFileSize(totalSize)}
                </div>
            </div>
            {files.length === 0 ? (
                <p className="text-neutral-600 text-center">No files in storage</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                        <div key={file.name} className="bg-white border border-neutral-200 p-4">
                            <div className="flex items-center mb-4">
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
                                    <p className="text-xs text-neutral-600">
                                        {file.lastModified}
                                        {file.size && <span className="ml-2">• {file.size}</span>}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownload(file.url, file.name)}
                                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                            >
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <footer className="pt-8 text-center">
                <p className="text-neutral-600 text-sm">
                    Deployed on <a href="https://zerops.io" className="text-neutral-800 hover:text-neutral-900 transition-colors">Zerops<ExternalLinkIcon /></a> | 
                    <a href="https://github.com/your-repo" className="text-neutral-800 hover:text-neutral-900 transition-colors"> Source Repository<ExternalLinkIcon /></a>
                </p>
            </footer>
        </div>
    );
} 