
"use client";

import type React from 'react';
import { createContext, useContext, useState, useMemo } from 'react';
import type { OverallStats } from '@/types/koreader';

interface FileLoadContextType {
  isFileLoaded: boolean;
  setIsFileLoaded: (loaded: boolean) => void;
  loadedStats: OverallStats | undefined;
  setLoadedStats: (stats: OverallStats | undefined) => void;
}

const FileLoadContext = createContext<FileLoadContextType | undefined>(undefined);

export function FileLoadProvider({ children }: { children: React.ReactNode }) {
  const [isFileLoaded, setIsFileLoaded] = useState(false);
  const [loadedStats, setLoadedStats] = useState<OverallStats | undefined>(undefined);

  const value = useMemo(() => ({ 
    isFileLoaded, 
    setIsFileLoaded,
    loadedStats,
    setLoadedStats
  }), [isFileLoaded, setIsFileLoaded, loadedStats, setLoadedStats]);

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
