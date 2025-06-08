
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import type React from 'react';

interface FileUploaderProps {
  onFileLoad: () => void;
}

export function FileUploader({ onFileLoad }: FileUploaderProps) {
  const handleFileUpload = () => {
    // In a real app, this would involve:
    // 1. Opening a file dialog: document.getElementById('fileInput').click();
    // 2. Reading the file: e.g., using FileReader and potentially sql.js
    // 3. Processing the data
    // For this demo, we'll just simulate it.
    onFileLoad();
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <UploadCloud className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Upload your KoReader Data</CardTitle>
          <CardDescription className="text-muted-foreground">
            Select your KoReader metadata.sqlite file to visualize your reading habits.
            KoInsight helps you easily see your reading progress over time and across devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {/* Hidden file input, can be triggered by the button */}
          {/* <Input id="fileInput" type="file" accept=".sqlite,.sqlite3" className="hidden" onChange={handleActualFileChange} /> */}
          <Button 
            size="lg" 
            onClick={handleFileUpload} 
            className="mt-4 w-full max-w-xs"
            aria-label="Load Reading Data"
          >
            <UploadCloud className="mr-2 h-5 w-5" />
            Load Reading Data (Demo)
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            (This is a demo version using mock data)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
