
'use server';
/**
 * @fileOverview Zod schemas for KoReader data types.
 *
 * - BookStatsSchema: Zod schema for BookStats.
 * - BookActivityInMonthSchema: Zod schema for BookActivityInMonth.
 * - MonthlyReadingSummarySchema: Zod schema for MonthlyReadingSummary.
 * - OverallStatsSchema: Zod schema for OverallStats.
 */

import { z } from 'zod';

export const BookStatsSchema = z.object({
  title: z.string().describe('The title of the book.'),
  totalPagesRead: z.number().describe('Overall current page read for this book or number of pages read.'),
  totalTimeMinutes: z.number().describe('Total time spent reading this book in minutes.'),
  sessions: z.number().describe('Number of reading sessions for this book.'),
  firstSessionDate: z.string().datetime({ offset: true }).optional().describe('Date of the first reading session.'),
  lastSessionDate: z.string().datetime({ offset: true }).optional().describe('Date of the last reading session.'),
  totalPages: z.number().describe('Total pages in the book.'),
});
export type BookStats = z.infer<typeof BookStatsSchema>;

export const BookActivityInMonthSchema = z.object({
  title: z.string().describe('The title of the book read in the month.'),
  pagesReadInMonth: z.number().describe('Number of pages read for this book in the month.'),
  completedInMonth: z.boolean().describe('Whether the book was completed in this month.'),
});
export type BookActivityInMonth = z.infer<typeof BookActivityInMonthSchema>;

export const MonthlyReadingSummarySchema = z.object({
  monthYear: z.string().describe('The month and year, e.g., "January 2024".'),
  totalPagesRead: z.number().describe('Total pages read across all books in this month.'),
  totalTimeMinutes: z.number().describe('Total time spent reading in this month.'),
  totalSessions: z.number().describe('Total number of reading sessions in this month.'),
  booksRead: z.array(BookActivityInMonthSchema).describe('List of book activities for the month.'),
});
export type MonthlyReadingSummary = z.infer<typeof MonthlyReadingSummarySchema>;

export const ReadingActivityPointSchema = z.object({
  date: z.string().describe('Date of the reading activity.'),
  pages: z.number().describe('Number of pages read on this date.'),
  time: z.number().describe('Time spent reading on this date in minutes.'),
});
export type ReadingActivityPoint = z.infer<typeof ReadingActivityPointSchema>;

export const NameValueSchema = z.object({
  name: z.string().describe('Name (e.g., book title).'),
  value: z.number().describe('Corresponding value (e.g., pages read or time spent).'),
});
export type NameValue = z.infer<typeof NameValueSchema>;


export const OverallStatsSchema = z.object({
  totalBooks: z.number().describe('Total number of unique books.'),
  totalPagesRead: z.number().describe('Total pages read across all books.'),
  totalTimeMinutes: z.number().describe('Total time spent reading across all books in minutes.'),
  totalSessions: z.number().describe('Total number of reading sessions across all books.'),
  readingActivity: z.array(ReadingActivityPointSchema).describe('Data points for reading activity over time.'),
  pagesReadPerBook: z.array(NameValueSchema).describe('Pages read for each book.'),
  timeSpentPerBook: z.array(NameValueSchema).describe('Time spent for each book in minutes.'),
  monthlySummaries: z.array(MonthlyReadingSummarySchema).optional().describe('Summaries of reading activity per month.'),
  allBookStats: z.array(BookStatsSchema).describe('Full list of statistics for all books.'),
});
export type OverallStats = z.infer<typeof OverallStatsSchema>;
