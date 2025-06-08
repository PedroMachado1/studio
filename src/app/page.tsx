
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
      // This case might happen if the user cancels file selection or if
      // we call this without a file (e.g. for mock data, though that path is changing)
      setIsFileLoaded(true); // Still show dashboard with mock/previous data
      setDashboardData(MOCK_OVERALL_STATS); // Or keep current dashboardData
      return;
    }

    setIsLoading(true);
    toast({
      title: "Processing your KoReader data...",
      description: "This may take a moment.",
    });

    try {
      const dataUri = arrayBufferToDataUri(fileBuffer);
      const processedStats: ProcessKoreaderDbOutput = await processKoreaderDb({ fileDataUri: dataUri });
      
      // Convert Zod schema output to TypeScript type if necessary, or ensure they are compatible
      // For this example, assuming ProcessKoreaderDbOutput is compatible with OverallStats type
      setDashboardData(processedStats as OverallStats);
      setIsFileLoaded(true);
      toast({
        title: "Data Processed Successfully!",
        description: "Displaying your KoReader statistics.",
      });
    } catch (error) {
      console.error("Error processing KoReader data:", error);
      setDashboardData(MOCK_OVERALL_STATS); // Fallback to mock data on error
      setIsFileLoaded(true); // Still show dashboard, but with mock data
      toast({
        title: "Error Processing File",
        description: "Could not process the KoReader data. Showing sample data instead.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsFileLoaded(false);
    setDashboardData(MOCK_OVERALL_STATS); // Reset to mock data
    // Potentially reset other data states
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
