
"use client";

import type React from 'react';
import { createContext, useContext, useState, useMemo } from 'react';

interface FileLoadContextType {
  isFileLoaded: boolean;
  setIsFileLoaded: (loaded: boolean) => void;
}

const FileLoadContext = createContext<FileLoadContextType | undefined>(undefined);

export function FileLoadProvider({ children }: { children: React.ReactNode }) {
  const [isFileLoaded, setIsFileLoaded] = useState(false);

  const value = useMemo(() => ({ isFileLoaded, setIsFileLoaded }), [isFileLoaded, setIsFileLoaded]);

  return (
    <FileLoadContext.Provider value={value}>
      {children}
    </FileLoadContext.Provider>
  );
}

export function useFileLoad() {
  const context = useContext(FileLoadContext);
  if (context === undefined) {
    throw new Error('useFileLoad must be used within a FileLoadProvider');
  }
  return context;
}
