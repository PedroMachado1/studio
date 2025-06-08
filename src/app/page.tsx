
"use client";

import type React from 'react';
import { useState } from 'react';
import { useFileLoad } from '@/context/FileLoadContext';
import { FileUploader } from '@/components/core/FileUploader';
import { Dashboard } from '@/components/core/Dashboard';
import type { OverallStats, BookStats, NameValue, ReadingActivityPoint } from '@/types/koreader';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import type { SqlJsStatic, Database as SQLJsDatabaseType } from 'sql.js';

// Helper function to parse total_pages from a JSON string (notes column)
function parseTotalPages(notes: string | null | undefined): number {
  if (!notes) return 0;
  try {
    const parsedNotes = JSON.parse(notes);
    const total = Number(parsedNotes.total_pages || parsedNotes.page_count || parsedNotes.doc_props?.total_pages || parsedNotes.statistics?.total_pages || 0);
    if (isNaN(total)) {
        return 0;
    }
    return total;
  } catch (e) {
    return 0;
  }
}

// Helper function to parse timestamps (unix or string)
function parseTimestampToDate(timestamp: any): Date | undefined {
    if (timestamp == null) return undefined;
    if (typeof timestamp === 'number') {
        if (timestamp > 946684800000 && timestamp < (new Date('2050-01-01').getTime())) { 
            return new Date(timestamp);
        } else if (timestamp > 946684800 && timestamp < (new Date('2050-01-01').getTime() / 1000) ) { 
             return new Date(timestamp * 1000);
        }
        if (String(timestamp).length > 10) {
            return new Date(timestamp);
        }
        return new Date(timestamp * 1000);
    }
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date;
        }
        const numTimestamp = Number(timestamp);
        if (!isNaN(numTimestamp)) {
            if (String(numTimestamp).length > 10) {
                 return new Date(numTimestamp);
            }
            return new Date(numTimestamp * 1000);
        }
    }
    return undefined;
}


export default function Home() {
  const { isFileLoaded, setIsFileLoaded, setLoadedStats } = useFileLoad();
  const [dashboardData, setDashboardData] = useState<OverallStats | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(Date.now().toString());
  const { toast } = useToast();

  const processDbClientSide = async (fileBuffer: ArrayBuffer): Promise<OverallStats> => {
    console.log('[ClientProcess] Starting client-side DB processing with new schema...');
    let SQL: SqlJsStatic | null = null;
    let db: SQLJsDatabaseType | null = null;

    try {
      const sqlJsModule = await import('sql.js');
      console.log('[ClientProcess] sql.js module loaded:', sqlJsModule);
      const initSqlJs = sqlJsModule.default;
      console.log('[ClientProcess] typeof initSqlJs:', typeof initSqlJs);

      if (typeof initSqlJs !== 'function') {
          console.error('[ClientProcess] Fatal: initSqlJs is not a function!', initSqlJs);
          throw new Error('SQL.js (initSqlJs) is not a function.');
      }
      
      console.log('[ClientProcess] Attempting to initialize SQL.js with locateFile pointing to sql.js.org...');
      SQL = await initSqlJs({
        locateFile: file => {
          const path = `https://sql.js.org/dist/${file}`;
          console.log(`[ClientProcess] locateFile requesting: ${path}`);
          return path;
        }
      });

      if (!SQL) {
          console.error('[ClientProcess] SQL.js failed to initialize (SQL object is null/undefined).');
          throw new Error('SQL.js failed to initialize.');
      }
      console.log('[ClientProcess] SQL.js initialized successfully.');

      const uint8Array = new Uint8Array(fileBuffer);
      db = new SQL.Database(uint8Array);
      if (!db) {
          console.error('[ClientProcess] Failed to open database.');
          throw new Error('Failed to open database.');
      }
      console.log('[ClientProcess] Database opened.');

      const tablesStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table';");
      const tableNames: string[] = [];
      while(tablesStmt.step()) {
        const row = tablesStmt.getAsObject();
        tableNames.push(row.name as string);
      }
      tablesStmt.free();
      console.log('[ClientProcess] Tables in the database:', tableNames);

      if (!tableNames.includes('book')) {
        console.error(`[ClientProcess] Critical: Table 'book' not found. Available tables: ${tableNames.join(', ')}`);
        throw new Error("Table 'book' not found. Check if this is a valid KoReader metadata.sqlite file.");
      }
      if (!tableNames.includes('page_stat_data')) {
        console.warn(`[ClientProcess] Warning: Table 'page_stat_data' not found. Total pages per book might be inaccurate.`);
      }
      
      const bookIdToTotalPages = new Map<string, number>();
      if (tableNames.includes('page_stat_data')) {
        const pageStatDataStmt = db.prepare(`
            SELECT id_book, MAX(total_pages) as book_total_pages 
            FROM page_stat_data 
            GROUP BY id_book
        `);
        console.log('[ClientProcess] Prepared SQL statement for page_stat_data table.');
        while(pageStatDataStmt.step()) {
            const row = pageStatDataStmt.getAsObject();
            if (row.id_book && row.book_total_pages != null) {
                bookIdToTotalPages.set(row.id_book as string, Number(row.book_total_pages));
            }
        }
        pageStatDataStmt.free();
        console.log(`[ClientProcess] Populated bookIdToTotalPages map with ${bookIdToTotalPages.size} entries.`);
      }

      const allBookStats: BookStats[] = [];
      const bookQuery = `
        SELECT 
          id, 
          title, 
          pages, 
          total_read_time, 
          last_open,
          notes 
        FROM book
      `;
      console.log(`[ClientProcess] Executing query for 'book' table: ${bookQuery}`);
      const bookStmt = db.prepare(bookQuery);
      
      let rowCount = 0;
      while (bookStmt.step()) { 
        rowCount++;
        const row = bookStmt.getAsObject(); 

        if (rowCount <= 5 || rowCount % 100 === 0) {
          console.log(`[ClientProcess] Processing book row ${rowCount}: id='${row.id}', title='${row.title}', pages=${row.pages}, total_read_time=${row.total_read_time}, last_open=${row.last_open}, notes_length=${(row.notes as string)?.length}`);
        }
        
        if (!row.title || (row.title as string).trim() === '') {
          continue;
        }

        const bookId = row.id as string;
        const title = row.title as string;
        
        let totalPages = bookIdToTotalPages.get(bookId) || 0;
        if (totalPages === 0 && row.notes) {
          totalPages = parseTotalPages(row.notes as string | null);
        }
        
        const pagesRead = row.pages != null ? Number(row.pages) : 0;
        const totalTimeMinutes = row.total_read_time != null ? Math.round(Number(row.total_read_time) / 60) : 0;
        
        const lastSessionDate = parseTimestampToDate(row.last_open);
        
        const bookStat: BookStats = {
          title: title,
          totalPagesRead: pagesRead > totalPages && totalPages > 0 ? totalPages : pagesRead,
          totalPages: totalPages,
          totalTimeMinutes: totalTimeMinutes,
          sessions: totalTimeMinutes > 0 ? 1 : 0, 
          firstSessionDate: lastSessionDate, 
          lastSessionDate: lastSessionDate,
        };
        allBookStats.push(bookStat);
      }
      bookStmt.free();
      console.log(`[ClientProcess] Finished processing ${rowCount} rows from book table.`);
      
      console.log(`[ClientProcess] Found ${allBookStats.length} book stat entries after processing.`);
      if (allBookStats.length > 0 && allBookStats[0]) {
          console.log('[ClientProcess] First processed book details:', JSON.stringify(allBookStats[0], null, 2));
      }

      const overallTotalPagesRead = allBookStats.reduce((sum, book) => sum + book.totalPagesRead, 0);
      const overallTotalTimeMinutes = allBookStats.reduce((sum, book) => sum + book.totalTimeMinutes, 0);
      const overallTotalSessions = allBookStats.reduce((sum, book) => sum + book.sessions, 0);
      
      const pagesReadPerBookData: NameValue[] = allBookStats
          .map(b => ({ name: b.title, value: b.totalPagesRead }))
          .filter(b => b.value > 0 || (allBookStats.find(fb => fb.title === b.name)?.totalPages ?? 0) > 0);

      const timeSpentPerBookData: NameValue[] = allBookStats
          .map(b => ({ name: b.title, value: b.totalTimeMinutes }))
          .filter(b => b.value > 0);

      const result: OverallStats = {
        totalBooks: allBookStats.length,
        totalPagesRead: overallTotalPagesRead,
        totalTimeMinutes: overallTotalTimeMinutes, 
        totalSessions: overallTotalSessions,   
        readingActivity: [], 
        pagesReadPerBook: pagesReadPerBookData,
        timeSpentPerBook: timeSpentPerBookData, 
        monthlySummaries: [], 
        allBookStats: allBookStats,
      };
      console.log('[ClientProcess] Returning OverallStats:', JSON.stringify(result, null, 2));
      return result;

    } catch (error)  {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('[ClientProcess] Error processing KoReader DB:', errorMessage);
      if (errorStack) {
          console.error('[ClientProcess] Stack trace:', errorStack);
      }
      throw error; 
    } finally {
      if (db) {
          console.log('[ClientProcess] Closing DB connection.');
          db.close();
      }
    }
  };

  const handleFileLoad = async (fileBuffer?: ArrayBuffer) => {
    if (!fileBuffer) { 
      // This case is for "Load Sample Data" which is effectively removed by removing MOCK_OVERALL_STATS
      // Now, if no file buffer, we do nothing, user must upload a file.
      // Or, if you want a specific "no file loaded" state, handle it here.
      // For now, this path won't be hit by FileUploader.
      console.log('[Home Page] No file buffer provided to handleFileLoad.');
      // setDashboardData(undefined); // Ensure it's undefined
      // setLoadedStats(undefined);
      // setIsFileLoaded(false); // Not strictly necessary to change isFileLoaded here if no buffer
      return;
    }

    setIsLoading(true);
    setDashboardData(undefined); // Clear previous data
    setLoadedStats(undefined);   // Clear previous data in context
    setIsFileLoaded(false);      // Set to false until processing finishes

    toast({
      title: "Processing your KoReader data...",
      description: "This may take a moment (client-side).",
    });
    console.log('[Home Page] File buffer received, starting client-side processing.');

    try {
      const processedStats = await processDbClientSide(fileBuffer);
      console.log('[Home Page] Received processedStats from client-side function:', JSON.stringify(processedStats, null, 2));
      
      setDashboardData(processedStats);
      setLoadedStats(processedStats);
      setIsFileLoaded(true);
      setDashboardKey(Date.now().toString());

      if (!processedStats || (processedStats.totalBooks === 0 && processedStats.allBookStats.length === 0 && processedStats.totalPagesRead === 0) ) {
        toast({
          title: "Data Processed",
          description: "Successfully processed the file, but no significant reading data was found. The displayed data might be minimal or empty.",
          duration: 9000, 
        });
      } else {
        toast({
          title: "Data Processed Successfully!",
          description: "Displaying your KoReader statistics (processed client-side).",
        });
      }
    } catch (error) {
      console.error("[Home Page] Error in handleFileLoad's try block (client-side processing):", error);
      setDashboardData(undefined); 
      setLoadedStats(undefined);
      setIsFileLoaded(true); // Still set to true to show the "Load Another File" button
      setDashboardKey(Date.now().toString()); // Re-key to clear dashboard if it was showing old data
      toast({
        title: "Error Processing File Client-Side",
        description: `Could not process the KoReader data. ${error instanceof Error ? error.message : String(error)}. Please try again or check the console.`,
        variant: "destructive",
        duration: 9000,
      });
    } finally {
      setIsLoading(false);
      console.log('[Home Page] handleFileLoad finished.');
    }
  };

  const handleReset = () => {
    setIsFileLoaded(false);
    setDashboardData(undefined); 
    setLoadedStats(undefined);
    setDashboardKey(Date.now().toString());
  };

  return (
    <>
      {!isFileLoaded || !dashboardData ? (
        <FileUploader onFileLoad={handleFileLoad} />
      ) : (
        <>
          {dashboardData && <Dashboard key={dashboardKey} data={dashboardData} />}
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
