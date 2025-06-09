
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
    // Check if it's a number (likely Unix timestamp)
    if (typeof timestamp === 'number') {
        // Heuristic: If it's a 10-digit number, assume seconds. If 13-digit, assume milliseconds.
        // Valid Unix timestamps (seconds) for dates after ~1973 and before ~2242 are 9-10 digits.
        // Valid Unix timestamps (milliseconds) for dates after ~1973 and before ~2242 are 12-13 digits.
        // Common KoReader timestamps seem to be in seconds from what I've seen, but could be ms.
        const tsStr = String(timestamp);
        if (tsStr.length === 10 || (tsStr.length === 9 && timestamp > 0)) { // Likely seconds
            // Ensure it's within a reasonable date range (e.g., after 2000, before 2050)
            if (timestamp > 946684800 && timestamp < 2524608000) {
                 return new Date(timestamp * 1000);
            }
        } else if (tsStr.length === 13) { // Likely milliseconds
             if (timestamp > 946684800000 && timestamp < 2524608000000) {
                return new Date(timestamp);
            }
        }
        // Fallback for other numeric cases, try treating as ms
        try {
            const d = new Date(timestamp);
            if (!isNaN(d.getTime()) && d.getFullYear() > 1990 && d.getFullYear() < 2070) return d;
            const d_s = new Date(timestamp * 1000);
             if (!isNaN(d_s.getTime()) && d_s.getFullYear() > 1990 && d_s.getFullYear() < 2070) return d_s;
        } catch (e) { /* ignore */ }
    }
    // Check if it's a string (parsable date string)
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date;
        }
        // Try parsing as number if it's a stringified number
        const numTimestamp = Number(timestamp);
        if (!isNaN(numTimestamp)) {
            return parseTimestampToDate(numTimestamp); // Recurse with number
        }
    }
    console.warn(`[parseTimestampToDate] Could not parse timestamp: ${timestamp}`);
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
      
      const bookIdToTotalPages = new Map<string, number>();
      if (tableNames.includes('page_stat_data')) {
        const pageStatDataTotalPagesStmt = db.prepare(`
            SELECT id_book, MAX(total_pages) as book_total_pages 
            FROM page_stat_data 
            GROUP BY id_book
        `);
        console.log('[ClientProcess] Prepared SQL statement for page_stat_data (total pages).');
        while(pageStatDataTotalPagesStmt.step()) {
            const row = pageStatDataTotalPagesStmt.getAsObject();
            if (row.id_book && row.book_total_pages != null) {
                bookIdToTotalPages.set(row.id_book as string, Number(row.book_total_pages));
            }
        }
        pageStatDataTotalPagesStmt.free();
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
      
      let bookRowCount = 0;
      while (bookStmt.step()) { 
        bookRowCount++;
        const row = bookStmt.getAsObject(); 
        
        if (bookRowCount <= 5 || bookRowCount % 100 === 0) {
          console.log(`[ClientProcess] Processing book row ${bookRowCount}: id='${row.id}', title='${row.title}', pages=${row.pages}, total_read_time=${row.total_read_time}, last_open=${row.last_open}, notes_length=${(row.notes as string)?.length}`);
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
        const totalTimeSeconds = row.total_read_time != null ? Number(row.total_read_time) : 0;
        const totalTimeMinutes = Math.round(totalTimeSeconds / 60);
        
        const lastSessionDateObj = parseTimestampToDate(row.last_open);
        
        const bookStat: BookStats = {
          title: title,
          totalPagesRead: pagesRead > totalPages && totalPages > 0 ? totalPages : pagesRead,
          totalPages: totalPages,
          totalTimeMinutes: totalTimeMinutes,
          sessions: totalTimeMinutes > 0 ? 1 : 0, // Simplified: 1 session if any time spent
          firstSessionDate: lastSessionDateObj, // Simplified: use last_open as first_session too
          lastSessionDate: lastSessionDateObj,
        };
        allBookStats.push(bookStat);
      }
      bookStmt.free();
      console.log(`[ClientProcess] Finished processing ${bookRowCount} rows from book table.`);
      
      console.log(`[ClientProcess] Found ${allBookStats.length} book stat entries after processing.`);
      if (allBookStats.length > 0 && allBookStats[0]) {
          console.log('[ClientProcess] First processed book details:', JSON.stringify(allBookStats[0], null, 2));
      }

      // Process Reading Activity
      const readingActivity: ReadingActivityPoint[] = [];
      if (tableNames.includes('page_stat_data')) {
        const activityQuery = `
            SELECT id_book, page, start_time, duration
            FROM page_stat_data
            ORDER BY start_time ASC
        `;
        console.log(`[ClientProcess] Executing query for 'page_stat_data' (for reading activity): ${activityQuery}`);
        const activityStmt = db.prepare(activityQuery);
        const dailyActivityMap = new Map<string, { pages: Set<string>, time: number }>();

        while(activityStmt.step()) {
            const row = activityStmt.getAsObject();
            const startTime = parseTimestampToDate(row.start_time);
            if (!startTime) continue;

            const dateStr = startTime.toISOString().split('T')[0];
            const durationMinutes = Math.round(Number(row.duration || 0) / 60);
            const bookPageIdentifier = `${row.id_book}-${row.page}`;

            if (!dailyActivityMap.has(dateStr)) {
                dailyActivityMap.set(dateStr, { pages: new Set(), time: 0 });
            }
            const activity = dailyActivityMap.get(dateStr)!;
            activity.time += durationMinutes;
            activity.pages.add(bookPageIdentifier); // Counts distinct book-page entries per day
        }
        activityStmt.free();
        console.log(`[ClientProcess] Processed page_stat_data for daily activity. Map size: ${dailyActivityMap.size}`);
        
        dailyActivityMap.forEach((value, date) => {
            readingActivity.push({ date, pages: value.pages.size, time: value.time });
        });
        readingActivity.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        console.log(`[ClientProcess] Generated readingActivity array with ${readingActivity.length} points.`);
      }


      const overallTotalPagesRead = allBookStats.reduce((sum, book) => sum + book.totalPagesRead, 0);
      const overallTotalTimeMinutes = allBookStats.reduce((sum, book) => sum + book.totalTimeMinutes, 0);
      const overallTotalSessions = allBookStats.reduce((sum, book) => sum + book.sessions, 0); // Still simplified
      
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
        readingActivity: readingActivity, 
        pagesReadPerBook: pagesReadPerBookData,
        timeSpentPerBook: timeSpentPerBookData, 
        monthlySummaries: [], // Monthly summaries still to be implemented
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
      console.log('[Home Page] No file buffer provided to handleFileLoad.');
      return;
    }

    setIsLoading(true);
    // Clear previous data before processing new file
    setDashboardData(undefined);
    setLoadedStats(undefined);
    setIsFileLoaded(false); // Will be set to true on success

    toast({
      title: "Processing your KoReader data...",
      description: "This may take a moment (client-side).",
    });
    console.log('[Home Page] File buffer received, starting client-side processing.');

    try {
      const processedStats = await processDbClientSide(fileBuffer);
      console.log('[Home Page] Received processedStats from client-side function:', JSON.stringify(processedStats, null, 2));
      
      // Set context data first
      setLoadedStats(processedStats);
      setIsFileLoaded(true); 
      
      // Then set local state for dashboard and update key
      setDashboardData(processedStats);
      setDashboardKey(Date.now().toString()); // Force Dashboard remount

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
      
      // Clear context and local data on error
      setLoadedStats(undefined);
      setIsFileLoaded(false); // Keep as false or handle "error state"
      setDashboardData(undefined); 
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
    // Update context first
    setIsFileLoaded(false);
    setLoadedStats(undefined);
    
    // Then local state
    setDashboardData(undefined); 
    setDashboardKey(Date.now().toString()); // Re-key to ensure Dashboard resets or clears
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

