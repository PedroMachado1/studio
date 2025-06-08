
"use client";

import type React from 'react';
import { useState } from 'react';
import { useFileLoad } from '@/context/FileLoadContext';
import { FileUploader } from '@/components/core/FileUploader';
import { Dashboard } from '@/components/core/Dashboard';
import { MOCK_OVERALL_STATS, type OverallStats, type BookStats, type NameValue, type ReadingActivityPoint } from '@/types/koreader';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
// Import types from sql.js for type checking, not for runtime.
import type { SqlJsStatic, Database as SQLJsDatabaseType } from 'sql.js';


// Helper functions previously in server-side flow, now client-side
function parseBookTitle(contentId: string | null | undefined): string {
  if (!contentId) {
    console.warn(`[ClientProcess] parseBookTitle received null or undefined content_id.`);
    return "Unknown Title (Invalid Input)";
  }
  try {
    let pathPart = contentId;
    // Example: (doc: /mnt/onboard/Books/My Great Book.epub).lua
    if (contentId.startsWith("(doc: ") && contentId.endsWith(").lua")) {
      pathPart = contentId.substring(6, contentId.length - 5);
    }
    const parts = pathPart.split('/');
    const fileNameWithExt = parts[parts.length - 1];
    const lastDotIndex = fileNameWithExt.lastIndexOf('.');
    if (lastDotIndex > 0) {
      return fileNameWithExt.substring(0, lastDotIndex);
    }
    if (fileNameWithExt === "") {
        console.warn(`[ClientProcess] parseBookTitle resulted in empty title for content_id: ${contentId}`);
        return "Unknown Title (Empty Filename)";
    }
    return fileNameWithExt; // Return filename if no extension found (e.g. for directories)
  } catch (e) {
    console.warn(`[ClientProcess] Error parsing book title from content_id: ${contentId}`, e);
    return "Unknown Title (Parse Error)";
  }
}

function parseTotalPages(notes: string | null | undefined): number {
  if (!notes) return 0;
  try {
    const parsedNotes = JSON.parse(notes);
    // Try various common keys where total_pages might be stored
    const total = Number(parsedNotes.total_pages || parsedNotes.page_count || parsedNotes.doc_props?.total_pages || parsedNotes.statistics?.total_pages || 0);
    if (isNaN(total)) {
        console.warn(`[ClientProcess] Parsed total pages is NaN from notes: ${notes}`);
        return 0;
    }
    return total;
  } catch (e) {
    // console.warn(`[ClientProcess] Failed to parse 'notes' JSON for total pages: ${notes}. Error: ${e instanceof Error ? e.message : String(e)}`);
    return 0; // Return 0 if notes is not valid JSON or doesn't contain page info
  }
}

export default function Home() {
  const { isFileLoaded, setIsFileLoaded } = useFileLoad();
  const [dashboardData, setDashboardData] = useState<OverallStats | null>(MOCK_OVERALL_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const processDbClientSide = async (fileBuffer: ArrayBuffer): Promise<OverallStats> => {
    console.log('[ClientProcess] Starting client-side DB processing...');
    let SQL: SqlJsStatic | null = null;
    let db: SQLJsDatabaseType | null = null;

    try {
      // Dynamically import initSqlJs
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
          console.log(`[ClientProcess] locateFile requesting: ${path}`); // Log the path being requested
          return path;
        }
      });

      if (!SQL) {
          console.error('[ClientProcess] SQL.js failed to initialize (SQL object is null/undefined).');
          throw new Error('SQL.js failed to initialize.');
      }
      console.log('[ClientProcess] SQL.js initialized successfully. SQL object:', SQL);

      const uint8Array = new Uint8Array(fileBuffer);
      db = new SQL.Database(uint8Array);
      if (!db) {
          console.error('[ClientProcess] Failed to open database.');
          throw new Error('Failed to open database.');
      }
      console.log('[ClientProcess] Database opened.');

      const allBookStats: BookStats[] = [];
      
      const countStmt = db.prepare(`SELECT COUNT(*) as count FROM bookmark`);
      let totalRowsInTable = 0;
      if (countStmt.step()) {
          totalRowsInTable = countStmt.getAsObject().count as number;
      }
      countStmt.free();
      console.log(`[ClientProcess] Total rows in bookmark table (unfiltered): ${totalRowsInTable}`);

      if (totalRowsInTable === 0) {
          console.warn('[ClientProcess] No rows found in bookmark table.');
      } else {
          const stmt = db.prepare(`
            SELECT 
              content_id, 
              progress, 
              page, 
              notes, 
              datetime
            FROM bookmark
          `);
          
          console.log('[ClientProcess] Prepared SQL statement for bookmark table.');

          let rowCount = 0;
          let loopEntered = false;

          while (stmt.step()) { 
            loopEntered = true;
            rowCount++;
            const row = stmt.getAsObject(); 

            if (rowCount <= 5 || rowCount % 100 === 0) {
              console.log(`[ClientProcess] Processing row ${rowCount}: content_id='${row.content_id}', progress=${row.progress}, page=${row.page}, notes (length)=${(row.notes as string)?.length}, datetime=${row.datetime}`);
            }
            
            if (!row.content_id || (row.content_id as string).trim() === '') {
              continue;
            }

            const title = parseBookTitle(row.content_id as string);
            const totalPages = parseTotalPages(row.notes as string | null);
            let pagesRead = 0;
            
            if (totalPages > 0 && row.progress != null && typeof row.progress === 'number' && !isNaN(row.progress as number)) {
              pagesRead = Math.round((row.progress as number) * totalPages);
            } else if (row.page != null && typeof row.page === 'number' && !isNaN(row.page as number)) {
              pagesRead = row.page as number;
            }
            
            if (totalPages > 0 && pagesRead > totalPages) pagesRead = totalPages;
            if (pagesRead < 0) pagesRead = 0;

            let lastSessionJsDate: Date | undefined = undefined;
            if (row.datetime != null && typeof row.datetime === 'number') { 
              lastSessionJsDate = new Date(row.datetime * 1000);
            } else if (row.datetime != null && typeof row.datetime === 'string') {
              const parsedDate = new Date(row.datetime);
              if (!isNaN(parsedDate.getTime())) {
                lastSessionJsDate = parsedDate;
              } else {
                  console.warn(`[ClientProcess] Could not parse datetime string: ${row.datetime} for title ${title}`);
              }
            }
            
            const bookStat: BookStats = {
              title: title,
              totalPagesRead: pagesRead,
              totalPages: totalPages > 0 ? totalPages : 0, 
              lastSessionDate: lastSessionJsDate,
              totalTimeMinutes: 0, 
              sessions: 0, 
              firstSessionDate: undefined, 
            };
            allBookStats.push(bookStat);
          }
          stmt.free();
          if (!loopEntered && totalRowsInTable > 0) {
              console.warn('[ClientProcess] stmt.step() never returned true, but totalRowsInTable > 0. This might indicate an issue with the query or DB state.');
          }
          console.log(`[ClientProcess] Finished processing ${rowCount} rows from bookmark table query.`);
      }
      
      console.log(`[ClientProcess] Found ${allBookStats.length} book stat entries after processing.`);
      if (allBookStats.length > 0) {
          console.log('[ClientProcess] First processed book details:', JSON.stringify(allBookStats[0], null, 2));
          if (allBookStats.length > 1) {
            console.log('[ClientProcess] Second processed book details:', JSON.stringify(allBookStats[1], null, 2));
          }
      }

      const uniqueBooks = new Map<string, BookStats>();
      allBookStats.forEach(stat => {
          const existing = uniqueBooks.get(stat.title);
          if (!existing || (stat.lastSessionDate && existing.lastSessionDate && stat.lastSessionDate > existing.lastSessionDate)) {
              uniqueBooks.set(stat.title, stat);
          } else if (!existing && !stat.lastSessionDate && !existing?.lastSessionDate) { 
             uniqueBooks.set(stat.title, stat);
          } else if (!existing) { 
              uniqueBooks.set(stat.title, stat);
          }
      });
      const finalBookStats = Array.from(uniqueBooks.values());
      console.log(`[ClientProcess] Found ${finalBookStats.length} unique books after filtering.`);

      const overallTotalPagesRead = finalBookStats.reduce((sum, book) => sum + book.totalPagesRead, 0);
      
      const pagesReadPerBookData: NameValue[] = finalBookStats
          .map(b => ({ name: b.title, value: b.totalPagesRead }))
          .filter(b => b.value > 0 || finalBookStats.find(fb => fb.title === b.name && fb.totalPages > 0));

      const result: OverallStats = {
        totalBooks: uniqueBooks.size,
        totalPagesRead: overallTotalPagesRead,
        totalTimeMinutes: 0, 
        totalSessions: 0,   
        readingActivity: [], 
        pagesReadPerBook: pagesReadPerBookData,
        timeSpentPerBook: [], 
        monthlySummaries: [], 
        allBookStats: finalBookStats,
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
      } else {
          console.log('[ClientProcess] DB connection was not established or already closed.');
      }
    }
  };

  const handleFileLoad = async (fileBuffer?: ArrayBuffer) => {
    if (!fileBuffer) { 
      setIsFileLoaded(true); 
      setDashboardData(MOCK_OVERALL_STATS); 
      console.log('[Home Page] No file buffer, using MOCK_OVERALL_STATS.');
      return;
    }

    setIsLoading(true);
    toast({
      title: "Processing your KoReader data...",
      description: "This may take a moment (client-side).",
    });
    console.log('[Home Page] File buffer received, starting client-side processing.');

    try {
      const processedStats = await processDbClientSide(fileBuffer);
      console.log('[Home Page] Received processedStats from client-side function:', JSON.stringify(processedStats, null, 2));
      
      if (!processedStats || (processedStats.totalBooks === 0 && processedStats.allBookStats.length === 0 && processedStats.totalPagesRead === 0) ) {
        console.warn('[Home Page] Processed stats appear to be empty or minimal.');
        setDashboardData(processedStats); 
        setIsFileLoaded(true); 
        toast({
          title: "Data Processed",
          description: "Successfully processed the file, but no significant reading data was found. The displayed data might be minimal or empty. Please check your KoReader file or the browser console for details.",
          duration: 9000, 
        });
      } else {
        setDashboardData(processedStats);
        setIsFileLoaded(true);
        toast({
          title: "Data Processed Successfully!",
          description: "Displaying your KoReader statistics (processed client-side).",
        });
      }
    } catch (error) {
      console.error("[Home Page] Error in handleFileLoad's try block (client-side processing):", error);
      setDashboardData(MOCK_OVERALL_STATS); 
      setIsFileLoaded(true); 
      toast({
        title: "Error Processing File Client-Side",
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
