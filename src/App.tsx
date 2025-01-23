import "./App.css";
import { UploadButton } from "./components/UploadButton";
import { Feed } from "./components/Feed";

function App() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <div className="w-full max-w-4xl">
                <UploadButton />
                <Feed />
            </div>
        </div>
    );
}

export default App;
