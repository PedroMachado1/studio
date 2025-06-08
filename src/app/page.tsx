
"use client";

import { useFileLoad } from '@/context/FileLoadContext';
import { FileUploader } from '@/components/core/FileUploader';
import { Dashboard } from '@/components/core/Dashboard';
import { MOCK_OVERALL_STATS } from '@/types/koreader';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { isFileLoaded, setIsFileLoaded } = useFileLoad();

  const handleFileLoad = () => {
    setIsFileLoaded(true);
  };

  const handleReset = () => {
    setIsFileLoaded(false);
    // Potentially reset other data states if actual file data was being stored
  };

  return (
    <>
      {!isFileLoaded ? (
        <FileUploader onFileLoad={handleFileLoad} />
      ) : (
        <>
          <Dashboard data={MOCK_OVERALL_STATS} />
          <div className="container mx-auto text-center py-8">
            <Button onClick={handleReset} variant="outline">
              Load Another File
            </Button>
          </div>
        </>
      )}
    </>
  );
}
