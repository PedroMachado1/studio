
"use client";

import { useState } from 'react';
import { FileUploader } from '@/components/core/FileUploader';
import { Dashboard } from '@/components/core/Dashboard';
import { MOCK_OVERALL_STATS } from '@/types/koreader';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);

  const handleFileLoad = () => {
    setShowDashboard(true);
  };

  const handleReset = () => {
    setShowDashboard(false);
  };

  return (
    <>
      {!showDashboard ? (
        <FileUploader onFileLoad={handleFileLoad} />
      ) : (
        <>
          <Dashboard data={MOCK_OVERALL_STATS} />
          <div className="container mx-auto text-center py-8">
            <Button onClick={handleReset} variant="outline">
              Load Another File (Reset Demo)
            </Button>
          </div>
        </>
      )}
    </>
  );
}
