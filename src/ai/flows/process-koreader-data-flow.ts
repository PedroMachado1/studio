
// 'use server'; // No longer a server action for DB processing
/**
 * @fileOverview This file previously contained a Server Action to process KoReader metadata.sqlite files.
 * This processing has now been moved to the client-side in src/app/page.tsx.
 * This file may still be used for exporting related types if needed by other server components or flows,
 * but the primary database processing logic is client-side.
 */

import {z} from 'genkit'; // Zod can still be useful for schema definitions if shared
// import type {Database} from 'sql.js'; // Not used here anymore
// import initSqlJs from 'sql.js'; // Not used here anymore
import { OverallStatsSchema, type BookStats, type OverallStats } from '@/ai/schemas/koreader-schemas'; // Schemas can be kept for reference

// Input schema for the original server action (kept for reference or if other server actions need it)
const ProcessKoreaderDbInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The KoReader metadata.sqlite file content as a data URI. Expected format: 'data:application/vnd.sqlite3;base64,<encoded_data>' or 'data:application/x-sqlite3;base64,<encoded_data>'."
    ),
});
export type ProcessKoreaderDbInput = z.infer<typeof ProcessKoreaderDbInputSchema>;

// Output type for the original server action (OverallStats)
export type ProcessKoreaderDbOutput = z.infer<typeof OverallStatsSchema>;


// The actual database processing logic has been moved to src/app/page.tsx
// This function is now a placeholder or can be removed if no longer referenced.
/*
export async function processKoreaderDb(input: ProcessKoreaderDbInput): Promise<ProcessKoreaderDbOutput> {
  console.warn('[processKoreaderDb SERVER ACTION] This function is deprecated. Processing moved to client-side.');
  // Return empty/default stats if called
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
}
*/

// Helper functions (parseBookTitle, parseTotalPages, safeParseJson)
// have been moved to src/app/page.tsx as they are now used client-side.
