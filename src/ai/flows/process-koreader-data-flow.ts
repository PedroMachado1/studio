
'use server';
/**
 * @fileOverview A Genkit flow to process KoReader metadata.sqlite files.
 *
 * - processKoreaderDb - A function that parses the SQLite DB and extracts reading statistics.
 * - ProcessKoreaderDbInput - The input type for the processKoreaderDb function.
 * - ProcessKoreaderDbOutput - The return type for the processKoreaderDb function (OverallStats).
 */

import {ai} from '@/ai/genkit';
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
    // If JSON parsing fails or key not found
    return 0;
  }
}


export async function processKoreaderDb(input: ProcessKoreaderDbInput): Promise<ProcessKoreaderDbOutput> {
  return processKoreaderDataFlow(input);
}

const processKoreaderDataFlow = ai.defineFlow(
  {
    name: 'processKoreaderDataFlow',
    inputSchema: ProcessKoreaderDbInputSchema,
    outputSchema: OverallStatsSchema,
  },
  async (input) => {
    let SQL: any;
    let db: Database | null = null;
    try {
      SQL = await initSqlJs({
        // Path to WASM file. Genkit might need this served or bundled.
        // For local dev with `genkit start`, ensure `sql-wasm.wasm` is findable.
        // It's often in `node_modules/sql.js/dist/sql-wasm.wasm`
        // locateFile: file => `/node_modules/sql.js/dist/${file}`
      });

      if (!input.fileDataUri.includes(',')) {
        throw new Error('Invalid data URI format.');
      }
      const base64Data = input.fileDataUri.split(',')[1];
      const fileBuffer = Buffer.from(base64Data, 'base64');
      const uint8Array = new Uint8Array(fileBuffer);

      db = new SQL.Database(uint8Array);

      const allBookStats: BookStats[] = [];
      
      // Query the bookmark table (common for KOReader metadata)
      // Adjust column names if your schema differs.
      // Common columns: content_id, progress (float 0-1), page (int), notes (JSON string), datetime
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

      const processedTitles = new Set<string>();

      while (stmt.step()) {
        const row = stmt.getAsObject();
        const title = parseBookTitle(row.content_id as string);

        if (processedTitles.has(title)) {
          // We only want the latest entry for each book from the bookmark table
          // as it usually represents the current state.
          // More sophisticated logic would be needed for full history / firstSessionDate.
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
        
        // Ensure pagesRead does not exceed totalPages if totalPages is known
        if (totalPages > 0 && pagesRead > totalPages) {
            pagesRead = totalPages;
        }


        const bookStat: BookStats = {
          title: title,
          totalPagesRead: pagesRead,
          totalPages: totalPages || 0, // Fallback to 0 if not found
          lastSessionDate: row.datetime ? new Date(row.datetime as string).toISOString() : undefined,
          // These are harder to get accurately without more complex queries or tables
          totalTimeMinutes: 0, 
          sessions: 0, 
          firstSessionDate: row.datetime ? new Date(row.datetime as string).toISOString() : undefined, // Placeholder, actually earliest
        };
        allBookStats.push(bookStat);
      }
      stmt.free();

      const overallTotalPagesRead = allBookStats.reduce((sum, book) => sum + book.totalPagesRead, 0);

      // For now, many fields in OverallStats will be empty or simplified
      // Full implementation requires deeper schema knowledge & more complex logic
      return {
        totalBooks: allBookStats.length,
        totalPagesRead: overallTotalPagesRead,
        totalTimeMinutes: 0, // Placeholder
        totalSessions: 0,    // Placeholder
        readingActivity: [], // Placeholder
        pagesReadPerBook: allBookStats.map(b => ({name: b.title, value: b.totalPagesRead})),
        timeSpentPerBook: [], // Placeholder
        monthlySummaries: [], // Placeholder
        allBookStats: allBookStats,
      };

    } catch (error) {
      console.error('Error processing KoReader DB:', error);
      // Return a default/empty stats object or throw, depending on desired error handling
      // For robustness, let's return a minimal valid structure.
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
      db?.close();
    }
  }
);
