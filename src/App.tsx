import React from 'react';
import "./App.css";
import { UploadButton } from "./components/UploadButton";
import { Feed } from "./components/Feed";
import { FileProvider } from './context/FileContext';

function App() {
    return (
        <FileProvider>
            <div className="flex flex-col items-center justify-center min-h-screen p-8">
                <div className="w-full max-w-4xl pt-14 sm:pt-30">
                <h2 className="text-xl font-semibold text-neutral-900 pb-4">React x Zerops Object Storage</h2>
                    <div className="border border-neutral-200 p-4">
                        <UploadButton />
                        <Feed />
                    </div>
                </div>
            </div>
        </FileProvider>
    );
}

export default App;
