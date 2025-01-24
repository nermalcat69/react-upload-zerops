import React, { createContext, useContext, useState, useCallback } from 'react';

interface StorageFile {
    name: string;
    url: string;
    lastModified: string;
    size: string;
}

interface FileContextType {
    files: StorageFile[];
    addFile: (file: StorageFile) => void;
    updateFiles: (files: StorageFile[]) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export function FileProvider({ children }: { children: React.ReactNode }) {
    const [files, setFiles] = useState<StorageFile[]>([]);

    const addFile = useCallback((file: StorageFile) => {
        setFiles(prevFiles => [file, ...prevFiles]);
    }, []);

    const updateFiles = useCallback((newFiles: StorageFile[]) => {
        setFiles(newFiles);
    }, []);

    return (
        <FileContext.Provider value={{ files, addFile, updateFiles }}>
            {children}
        </FileContext.Provider>
    );
}

export function useFiles() {
    const context = useContext(FileContext);
    if (context === undefined) {
        throw new Error('useFiles must be used within a FileProvider');
    }
    return context;
} 