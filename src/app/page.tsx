
"use client";

import type React from 'react';
import { useState } from 'react';
import { useFileLoad } from '@/context/FileLoadContext';
import { FileUploader } from '@/components/core/FileUploader';
import { Dashboard } from '@/components/core/Dashboard';
import { MOCK_OVERALL_STATS, type OverallStats } from '@/types/koreader'; // Keep MOCK for fallback
import { Button } from '@/components/ui/button';
import { processKoreaderDb, type ProcessKoreaderDbOutput } from '@/ai/flows/process-koreader-data-flow';
import { useToast } from "@/hooks/use-toast";

// Helper to convert ArrayBuffer to Base64 Data URI
function arrayBufferToDataUri(buffer: ArrayBuffer, mimeType: string = 'application/vnd.sqlite3'): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}


export default function Home() {
  const { isFileLoaded, setIsFileLoaded } = useFileLoad();
  const [dashboardData, setDashboardData] = useState<OverallStats | null>(MOCK_OVERALL_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileLoad = async (fileBuffer?: ArrayBuffer) => {
    if (!fileBuffer) {
      setIsFileLoaded(true); 
      setDashboardData(MOCK_OVERALL_STATS); 
      return;
    }

    setIsLoading(true);
    toast({
      title: "Processing your KoReader data...",
      description: "This may take a moment.",
    });
    console.log('[Home Page] File buffer received, starting processing.');

    try {
      const dataUri = arrayBufferToDataUri(fileBuffer);
      console.log('[Home Page] Converted file to data URI, calling processKoreaderDb.');
      const processedStats: ProcessKoreaderDbOutput = await processKoreaderDb({ fileDataUri: dataUri });
      console.log('[Home Page] Received processedStats from server:', JSON.stringify(processedStats, null, 2));
      
      if (!processedStats || (processedStats.totalBooks === 0 && processedStats.allBookStats.length === 0 && processedStats.totalPagesRead === 0) ) {
        console.warn('[Home Page] Processed stats appear to be empty or minimal.');
        setDashboardData(processedStats as OverallStats); // Set dashboard with (potentially empty) processed data
        setIsFileLoaded(true);
        toast({
          title: "Data Processed",
          description: "Successfully processed the file, but no significant reading data was found. The displayed data might be minimal or empty. Please check your KoReader file or the server console for details.",
          duration: 9000, 
        });
      } else {
        setDashboardData(processedStats as OverallStats);
        setIsFileLoaded(true);
        toast({
          title: "Data Processed Successfully!",
          description: "Displaying your KoReader statistics.",
        });
      }
    } catch (error) {
      console.error("[Home Page] Error in handleFileLoad's try block:", error);
      setDashboardData(MOCK_OVERALL_STATS); // Fallback to mock data on error
      setIsFileLoaded(true); 
      toast({
        title: "Error Processing File",
        description: "Could not process the KoReader data. Showing sample data instead. Check browser console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('[Home Page] handleFileLoad finished.');
    }
  };

  const handleReset = () => {
    setIsFileLoaded(false);
    setDashboardData(MOCK_OVERALL_STATS); 
  };

  return (
    <>
      {!isFileLoaded ? (
        <FileUploader onFileLoad={handleFileLoad} />
      ) : (
        <>
          <Dashboard data={dashboardData || MOCK_OVERALL_STATS} />
          <div className="container mx-auto text-center py-8">
            <Button onClick={handleReset} variant="outline" disabled={isLoading}>
              {isLoading ? "Processing..." : "Load Another File"}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
