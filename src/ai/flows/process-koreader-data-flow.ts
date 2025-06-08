
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
import initSqlJs from 'sql.js';
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
    return fileNameWithExt; // Fallback if no extension
  } catch (e) {
    console.warn(`[processKoreaderDb] Error parsing book title from content_id: ${contentId}`, e);
    return "Unknown Title";
  }
}

// Helper to parse JSON safely from notes
function safeParseJson(jsonString: string | null | undefined, key: string, defaultValue: any = null) {
  if (!jsonString) return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed[key] || defaultValue;
  } catch (e) {
    // console.warn(`[processKoreaderDb] Failed to parse 'notes' JSON for key '${key}': ${jsonString}. Error: ${e}`);
    return defaultValue;
  }
}

// Helper to parse total pages from notes, checking multiple possible locations
function parseTotalPages(notes: string | null | undefined): number {
  if (!notes) return 0;
  try {
    const parsedNotes = JSON.parse(notes);
    // Check common locations for total_pages or page_count
    return parsedNotes.total_pages || parsedNotes.page_count || parsedNotes.doc_props?.total_pages || 0;
  } catch (e) {
    // console.warn(`[processKoreaderDb] Failed to parse 'notes' JSON for total pages: ${notes}. Error: ${e}`);
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
    });
    console.log('[processKoreaderDb] SQL.js initialized.');

    if (!input.fileDataUri.includes(',')) {
      throw new Error('Invalid data URI format.');
    }
    const base64Data = input.fileDataUri.split(',')[1];
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const uint8Array = new Uint8Array(fileBuffer);

    db = new SQL.Database(uint8Array);
    console.log('[processKoreaderDb] Database opened.');

    const allBookStats: BookStats[] = [];
    
    const stmt = db.prepare(`
      SELECT 
        content_id, 
        progress, 
        page, 
        notes, 
        datetime
      FROM bookmark 
      ORDER BY content_id, datetime DESC
    `);
    console.log('[processKoreaderDb] Prepared SQL statement for bookmark table.');

    const processedTitles = new Set<string>();
    let rowCount = 0;

    while (stmt.step()) {
      rowCount++;
      const row = stmt.getAsObject();
      const title = parseBookTitle(row.content_id as string);

      if (processedTitles.has(title)) {
        continue;
      }
      processedTitles.add(title);

      const totalPages = parseTotalPages(row.notes as string | null);
      let pagesRead = 0;
      if (totalPages > 0 && row.progress != null) {
        pagesRead = Math.round((row.progress as number) * totalPages);
      } else if (row.page != null) {
        pagesRead = row.page as number;
      }
      
      if (totalPages > 0 && pagesRead > totalPages) {
          pagesRead = totalPages;
      }

      const bookStat: BookStats = {
        title: title,
        totalPagesRead: pagesRead,
        totalPages: totalPages || 0, 
        lastSessionDate: row.datetime ? new Date(row.datetime as string).toISOString() : undefined,
        totalTimeMinutes: 0, 
        sessions: 0, 
        firstSessionDate: row.datetime ? new Date(row.datetime as string).toISOString() : undefined, 
      };
      allBookStats.push(bookStat);
    }
    stmt.free();
    console.log(`[processKoreaderDb] Processed ${rowCount} rows from bookmark table.`);
    console.log(`[processKoreaderDb] Found ${allBookStats.length} unique books.`);
    if (allBookStats.length > 0) {
        console.log('[processKoreaderDb] First book details:', JSON.stringify(allBookStats[0], null, 2));
    }


    const overallTotalPagesRead = allBookStats.reduce((sum, book) => sum + book.totalPagesRead, 0);

    const result: ProcessKoreaderDbOutput = {
      totalBooks: allBookStats.length,
      totalPagesRead: overallTotalPagesRead,
      totalTimeMinutes: 0, 
      totalSessions: 0,    
      readingActivity: [], 
      pagesReadPerBook: allBookStats.map(b => ({name: b.title, value: b.totalPagesRead})),
      timeSpentPerBook: [], 
      monthlySummaries: [], 
      allBookStats: allBookStats,
    };
    console.log('[processKoreaderDb] Returning OverallStats:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('[processKoreaderDb] Error processing KoReader DB:', error);
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
    console.log('[processKoreaderDb] Closing DB connection if open.');
    db?.close();
  }
}
