import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

interface StorageFile {
    name: string;
    url: string;
    lastModified: string;
    isImage: boolean;
}

export function Feed() {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const generateSignedUrl = (objectKey: string) => {
        const date = new Date();
        const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
        const timestamp = Math.floor(date.getTime() / 1000);
        const expiration = timestamp + 3600; // URL expires in 1 hour

        const stringToSign = `GET\n\n\n${expiration}\n/${process.env.VITE_BUCKET_NAME}/${objectKey}`;
        const signature = CryptoJS.enc.Base64.stringify(
            CryptoJS.HmacSHA1(stringToSign, process.env.VITE_SECRET_KEY!)
        );

        return `${process.env.VITE_STORAGE_URL}/${process.env.VITE_BUCKET_NAME}/${objectKey}?` +
            `AWSAccessKeyId=${process.env.VITE_ACCESS_KEY}&` +
            `Expires=${expiration}&` +
            `Signature=${encodeURIComponent(signature)}`;
    };

    const isImageFile = (filename: string): boolean => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        return imageExtensions.some(ext => 
            filename.toLowerCase().endsWith(ext)
        );
    };

    const fetchFiles = async () => {
        try {
            const response = await fetch(
                `${process.env.VITE_STORAGE_URL}/${process.env.VITE_BUCKET_NAME}/?list-type=2`, 
                {
                    headers: {
                        'x-api-key': process.env.VITE_ACCESS_KEY!,
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const contents = xmlDoc.getElementsByTagName('Contents');
            const fileList: StorageFile[] = Array.from(contents)
                .map(content => {
                    const key = content.getElementsByTagName('Key')[0]?.textContent || '';
                    const lastModified = content.getElementsByTagName('LastModified')[0]?.textContent || '';
                    const url = `${process.env.VITE_STORAGE_URL}/${process.env.VITE_BUCKET_NAME}/${key}`;
                    
                    return {
                        name: key,
                        url: url,
                        lastModified: new Date(lastModified).toLocaleString(),
                        isImage: isImageFile(key)
                    };
                })
                .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
                .slice(0, 5);

            setFiles(fileList);
        } catch (err) {
            console.error('Error fetching files:', err);
            setError('Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        const interval = setInterval(fetchFiles, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="text-center mt-8">Loading files...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center mt-8">{error}</div>;
    }

    return (
        <div className="mt-8 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Uploaded Files</h2>
            {files.length === 0 ? (
                <p className="text-gray-500 text-center">No files in storage</p>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {files.map((file, index) => (
                        <div 
                            key={index} 
                            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
                        >
                            {file.isImage ? (
                                <div className="mb-4">
                                    <img 
                                        src={file.url}
                                        alt={file.name}
                                        className="w-full h-48 object-cover rounded-md"
                                        loading="lazy"
                                    />
                                </div>
                            ) : (
                                <div className="mb-4 p-8 bg-gray-50 rounded-md flex items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900 truncate max-w-xs">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {file.lastModified}
                                    </p>
                                </div>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 