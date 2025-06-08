
'use server';
/**
 * @fileOverview A Server Action to process KoReader metadata.sqlite files.
 *
 * - processKoreaderDb - A function that parses the SQLite DB and extracts reading statistics.
 * - ProcessKoreaderDbInput - The input type for the processKoreaderDb function.
 * - ProcessKoreaderDbOutput - The return type for the processKoreaderDb function (OverallStats).
 */

import {z} from 'genkit';
import type {Database} from 'sql.js';
import initSqlJs from 'sql.js'; // sql.js version 1.10.3 or higher
import { OverallStatsSchema, BookStatsSchema, type BookStats, type OverallStats } from '@/ai/schemas/koreader-schemas';

const ProcessKoreaderDbInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The KoReader metadata.sqlite file content as a data URI. Expected format: 'data:application/vnd.sqlite3;base64,<encoded_data>' or 'data:application/x-sqlite3;base64,<encoded_data>'."
    ),
});
export type ProcessKoreaderDbInput = z.infer<typeof ProcessKoreaderDbInputSchema>;
export type ProcessKoreaderDbOutput = z.infer<typeof OverallStatsSchema>;


// Helper function to parse title from content_id
function parseBookTitle(contentId: string): string {
  // Example content_id: "(doc: /storage/emulated/0/Books/My Awesome Book.epub).lua"
  // Example content_id: "/mnt/media_rw/SDB1/books/Another Great Book.pdf"
  try {
    let pathPart = contentId;
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
        console.warn(`[processKoreaderDb] parseBookTitle resulted in empty title for content_id: ${contentId}`);
        return "Unknown Title (Empty Filename)";
    }
    return fileNameWithExt; // Fallback if no extension
  } catch (e) {
    console.warn(`[processKoreaderDb] Error parsing book title from content_id: ${contentId}`, e);
    return "Unknown Title (Parse Error)";
  }
}

// Helper to parse JSON safely from notes
function safeParseJson(jsonString: string | null | undefined, key: string, defaultValue: any = null) {
  if (!jsonString) return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed[key] || defaultValue;
  } catch (e) {
    console.warn(`[processKoreaderDb] Failed to parse 'notes' JSON for key '${key}': ${jsonString}. Error: ${e instanceof Error ? e.message : String(e)}`);
    return defaultValue;
  }
}

// Helper to parse total pages from notes, checking multiple possible locations
function parseTotalPages(notes: string | null | undefined): number {
  if (!notes) return 0;
  try {
    const parsedNotes = JSON.parse(notes);
    // Check common locations for total_pages or page_count
    const total = Number(parsedNotes.total_pages || parsedNotes.page_count || parsedNotes.doc_props?.total_pages || 0);
    if (isNaN(total)) {
        console.warn(`[processKoreaderDb] Parsed total pages is NaN from notes: ${notes}`);
        return 0;
    }
    return total;
  } catch (e) {
    console.warn(`[processKoreaderDb] Failed to parse 'notes' JSON for total pages: ${notes}. Error: ${e instanceof Error ? e.message : String(e)}`);
    return 0; // If JSON parsing fails or key not found
  }
}


export async function processKoreaderDb(input: ProcessKoreaderDbInput): Promise<ProcessKoreaderDbOutput> {
  console.log('[processKoreaderDb] Starting processing...');
  let SQL: any;
  let db: Database | null = null;
  try {
    SQL = await initSqlJs({
      // sql.js attempts to load sql-wasm.wasm from node_modules in Node.js
      // locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` // Fallback for some environments
    });
    if (!SQL) {
        console.error('[processKoreaderDb] SQL.js failed to initialize.');
        throw new Error('SQL.js failed to initialize.');
    }
    console.log('[processKoreaderDb] SQL.js initialized.');

    if (!input.fileDataUri.includes(',')) {
      console.error('[processKoreaderDb] Invalid data URI format.');
      throw new Error('Invalid data URI format.');
    }
    const base64Data = input.fileDataUri.split(',')[1];
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const uint8Array = new Uint8Array(fileBuffer);

    db = new SQL.Database(uint8Array);
    if (!db) {
        console.error('[processKoreaderDb] Failed to open database.');
        throw new Error('Failed to open database.');
    }
    console.log('[processKoreaderDb] Database opened.');

    const allBookStats: BookStats[] = [];
    
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM bookmark WHERE content_id IS NOT NULL AND content_id != ''`);
    let totalRowsInTable = 0;
    if (countStmt.step()) {
        totalRowsInTable = countStmt.getAsObject().count as number;
    }
    countStmt.free();
    console.log(`[processKoreaderDb] Total relevant rows in bookmark table: ${totalRowsInTable}`);

    if (totalRowsInTable === 0) {
        console.warn('[processKoreaderDb] No relevant rows found in bookmark table. Aborting further processing.');
    } else {
        const stmt = db.prepare(`
          SELECT 
            content_id, 
            progress, 
            page, 
            notes, 
            datetime
          FROM bookmark 
          WHERE content_id IS NOT NULL AND content_id != '' 
          ORDER BY content_id, datetime DESC 
        `);
        console.log('[processKoreaderDb] Prepared SQL statement for bookmark table.');

        let rowCount = 0;

        while (stmt.step()) {
          rowCount++;
          const row = stmt.getAsObject();

          if (rowCount <= 5 || rowCount % 100 === 0) {
            console.log(`[processKoreaderDb] Processing row ${rowCount}: content_id='${row.content_id}', progress=${row.progress}, page=${row.page}, notes (length)=${(row.notes as string)?.length}, datetime=${row.datetime}`);
          }
          
          const title = parseBookTitle(row.content_id as string);

          const totalPages = parseTotalPages(row.notes as string | null);
          let pagesRead = 0;
          
          if (totalPages > 0 && row.progress != null && typeof row.progress === 'number' && !isNaN(row.progress as number)) {
            pagesRead = Math.round((row.progress as number) * totalPages);
          } else if (row.page != null && typeof row.page === 'number' && !isNaN(row.page as number)) {
            pagesRead = row.page as number;
          }
          
          if (totalPages > 0 && pagesRead > totalPages) {
              pagesRead = totalPages;
          }
          if (pagesRead < 0) pagesRead = 0;


          let lastSessionIsoDate: string | undefined = undefined;
          if (row.datetime != null && typeof row.datetime === 'number') {
            lastSessionIsoDate = new Date(row.datetime * 1000).toISOString();
          } else if (row.datetime != null && typeof row.datetime === 'string') {
            const parsedDate = new Date(row.datetime);
            if (!isNaN(parsedDate.getTime())) {
                lastSessionIsoDate = parsedDate.toISOString();
            } else {
                console.warn(`[processKoreaderDb] Could not parse datetime string: ${row.datetime} for title ${title}`);
            }
          }
          
          const bookStat: BookStats = {
            title: title,
            totalPagesRead: pagesRead,
            totalPages: totalPages > 0 ? totalPages : 0, 
            lastSessionDate: lastSessionIsoDate,
            totalTimeMinutes: 0, 
            sessions: 0, 
            firstSessionDate: undefined, 
          };
          allBookStats.push(bookStat);
        }
        stmt.free();
        console.log(`[processKoreaderDb] Finished processing ${rowCount} rows from bookmark table query.`);
    }
    
    console.log(`[processKoreaderDb] Found ${allBookStats.length} book stat entries after processing.`);
    if (allBookStats.length > 0) {
        console.log('[processKoreaderDb] First processed book details:', JSON.stringify(allBookStats[0], null, 2));
        if(allBookStats.length > 1) console.log('[processKoreaderDb] Second processed book details:', JSON.stringify(allBookStats[1], null, 2));
    }


    const overallTotalPagesRead = allBookStats.reduce((sum, book) => sum + book.totalPagesRead, 0);
    
    const pagesReadPerBookData = allBookStats
        .map(b => ({ name: b.title, value: b.totalPagesRead }))
        .filter(b => b.value > 0 || allBookStats.find(ab => ab.title === b.name && ab.totalPages > 0));


    const result: ProcessKoreaderDbOutput = {
      totalBooks: new Set(allBookStats.map(b => b.title)).size,
      totalPagesRead: overallTotalPagesRead,
      totalTimeMinutes: 0, 
      totalSessions: 0,    
      readingActivity: [], 
      pagesReadPerBook: pagesReadPerBookData,
      timeSpentPerBook: [], 
      monthlySummaries: [], 
      allBookStats: allBookStats,
    };
    console.log('[processKoreaderDb] Returning OverallStats:', JSON.stringify(result, null, 2));
    return result;

  } catch (error)  {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[processKoreaderDb] Error processing KoReader DB:', errorMessage, errorStack);
    return {
      totalBooks: 0,
      totalPagesRead: 0,
      totalTimeMinutes: 0,
      totalSessions: 0,
      readingActivity: [],
      pagesReadPerBook: [],
      timeSpentPerBook: [],
      monthlySummaries: [],
      allBookStats: [],
    };
  } finally {
    if (db) {
        console.log('[processKoreaderDb] Closing DB connection.');
        db.close();
    } else {
        console.log('[processKoreaderDb] DB connection was not established or already closed.');
    }
  }
}
