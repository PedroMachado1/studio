
"use client";

import type React from 'react';
import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileLoad: (fileData: ArrayBuffer) => void; 
}

export function FileUploader({ onFileLoad }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      if (!file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid .sqlite or .sqlite3 file.",
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      toast({
        title: "File Selected",
        description: `Preparing to process ${file.name}...`,
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          onFileLoad(arrayBuffer); // Pass ArrayBuffer up for processing
        } else {
          toast({
            title: "Error Reading File",
            description: "Could not read the file content.",
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: "Error Reading File",
          description: "An error occurred while trying to read the file.",
          variant: "destructive",
        });
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          <input
            id="fileInput"
            type="file"
            accept=".sqlite,.sqlite3,application/vnd.sqlite3,application/x-sqlite3"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Button
            size="lg"
            onClick={handleButtonClick}
            className="mt-4 w-full max-w-xs"
            aria-label="Load Reading Data"
          >
            <UploadCloud className="mr-2 h-5 w-5" />
            Load Reading Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
