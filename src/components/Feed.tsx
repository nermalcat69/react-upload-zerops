import React, { useState, useEffect } from 'react';

interface StorageFile {
    name: string;
    url: string;
    lastModified: string;
}

export function Feed() {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            console.log('Fetching from:', url);

            const response = await fetch(url, {
                headers: {
                    'x-api-key': accessKey || '',
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Fetch error:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText
                });
                throw new Error(`Failed to fetch files: ${response.status} ${errorText}`);
            }

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const contents = xmlDoc.getElementsByTagName('Contents');

            const fileList: StorageFile[] = Array.from(contents).map(content => {
                const key = content.getElementsByTagName('Key')[0]?.textContent || '';
                const lastModified = content.getElementsByTagName('LastModified')[0]?.textContent || '';
                const fileUrl = `${storageUrl}/${bucketName}/${key}`;
                
                return {
                    name: key,
                    url: fileUrl,
                    lastModified: new Date(lastModified).toLocaleString(),
                };
            }).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

            setFiles(fileList);
        } catch (err) {
            console.error('Error fetching files:', err);
            setError(err instanceof Error ? err.message : 'Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (url: string, filename: string) => {
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
        document.title = "Your Project Name - File Storage"; // Change the title as per your project
        fetchFiles();
        const interval = setInterval(fetchFiles, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="text-center mt-8">Loading files...</div>;
    if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

    return (
        <div className="mt-8 w-full max-w-7xl mx-auto px-4">
            <h2 className="text-xl font-bold mb-6">Uploaded Files</h2>
            {files.length === 0 ? (
                <p className="text-gray-500 text-center">No files in storage</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file, index) => (
                        <div key={index} className="bg-white border border-gray-200 p-4">
                            <div className="flex items-center mb-4">
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{file.lastModified}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownload(file.url, file.name)}
                                className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <footer className="pt-8 text-center">
                <p className="text-gray-600 text-sm">
                    Deployed on <a href="https://zerops.io" className="text-blue-500 hover:underline">Zerops</a> | 
                    <a href="https://github.com/your-repo" className="text-blue-500 hover:underline"> Source Repository</a>
                </p>
            </footer>
        </div>
    );
} 