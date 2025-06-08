
"use client";

import { useState } from 'react';
import { Header } from '@/components/core/Header';
import { FileUploader } from '@/components/core/FileUploader';
import { Dashboard } from '@/components/core/Dashboard';
import { MOCK_OVERALL_STATS } from '@/types/koreader';
import { Button } from '@/components/ui/button'; // For reset button

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);

  const handleFileLoad = () => {
    // Here you would normally process the file and fetch data.
    // For now, we just enable the dashboard with mock data.
    setShowDashboard(true);
  };

  const handleReset = () => {
    setShowDashboard(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
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
      </main>
      <footer className="py-6 px-4 md:px-6 border-t border-border mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KoReader Insight Web. For demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
}
