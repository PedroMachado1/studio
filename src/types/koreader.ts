
export interface ReadingSession {
  id: string;
  bookTitle: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  pagesRead: number;
  device: string;
}

export interface BookStats {
  title: string;
  totalPagesRead: number; // Overall current page read for this book
  totalTimeMinutes: number;
  sessions: number;
  firstSessionDate?: Date;
  lastSessionDate?: Date;
  totalPages: number; // Total pages in the book
}

export interface BookActivityInMonth {
  title: string;
  pagesReadInMonth: number;
  completedInMonth: boolean;
}

export interface MonthlyReadingSummary {
  monthYear: string; // e.g., "January 2024"
  totalPagesRead: number; // Total pages read across all books in this month
  totalTimeMinutes: number;
  totalSessions: number;
  booksRead: BookActivityInMonth[];
}

export interface NameValue { // Added from schemas to be used by OverallStats if needed
  name: string;
  value: number;
}

export interface ReadingActivityPoint { // Added from schemas
  date: string;
  pages: number;
  time: number;
}

export interface OverallStats {
  totalBooks: number;
  totalPagesRead: number;
  totalTimeMinutes: number;
  totalSessions: number;
  readingActivity: ReadingActivityPoint[];
  pagesReadPerBook: NameValue[]; 
  timeSpentPerBook: NameValue[];
  monthlySummaries?: MonthlyReadingSummary[];
  allBookStats: BookStats[]; // Full list of book stats
}
