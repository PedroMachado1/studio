
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
  totalPagesRead: number; // Overall total pages read for this book
  totalTimeMinutes: number;
  sessions: number;
  firstSessionDate?: Date;
  lastSessionDate?: Date;
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

export interface OverallStats {
  totalBooks: number;
  totalPagesRead: number;
  totalTimeMinutes: number;
  totalSessions: number;
  readingActivity: { date: string; pages: number; time: number }[];
  pagesReadPerBook: { name: string, value: number }[]; // Corresponds to BookStats.totalPagesRead
  timeSpentPerBook: { name: string, value: number }[];
  monthlySummaries?: MonthlyReadingSummary[];
}

// Mock data for BookStats (overall book progress)
export const MOCK_BOOK_STATS_LIST: BookStats[] = [
  {
    title: "The Great Novel",
    totalPagesRead: 300, // Read 300 pages in total for this book
    totalTimeMinutes: 720,
    sessions: 15,
    firstSessionDate: new Date("2023-01-10T10:00:00Z"),
    lastSessionDate: new Date("2024-01-15T18:30:00Z"), // Completed in Jan 2024
  },
  {
    title: "Another Story",
    totalPagesRead: 150, // Read 150 pages in total for this book, but not completed
    totalTimeMinutes: 600,
    sessions: 10,
    firstSessionDate: new Date("2023-02-05T14:00:00Z"),
    lastSessionDate: new Date("2024-01-20T20:00:00Z"),
  },
  {
    title: "Sci-Fi Adventure",
    totalPagesRead: 300, // Read 300 pages in total for this book, but not completed (assume 400 total pages in book)
    totalTimeMinutes: 900,
    sessions: 20,
    firstSessionDate: new Date("2023-03-01T09:00:00Z"),
    lastSessionDate: new Date("2024-02-10T22:00:00Z"),
  },
  {
    title: "Mystery Tales",
    totalPagesRead: 150, // Read 150 pages in total for this book
    totalTimeMinutes: 360,
    sessions: 8,
    firstSessionDate: new Date("2023-04-12T11:00:00Z"),
    lastSessionDate: new Date("2023-12-20T16:30:00Z"), // Completed in Dec 2023
  },
  {
    title: "Learning React",
    totalPagesRead: 150, // Read 150 pages in total for this book
    totalTimeMinutes: 420,
    sessions: 25,
    firstSessionDate: new Date("2023-05-01T08:00:00Z"),
    lastSessionDate: new Date("2024-02-28T17:00:00Z"), // Completed in Feb 2024
  },
];


const MOCK_MONTHLY_SUMMARIES_DATA: MonthlyReadingSummary[] = [
  {
    monthYear: "December 2023",
    totalPagesRead: 350,
    totalTimeMinutes: 18 * 60,
    totalSessions: 20,
    booksRead: [
      { title: "The Great Novel", pagesReadInMonth: 200, completedInMonth: false },
      { title: "Mystery Tales", pagesReadInMonth: 150, completedInMonth: true }
    ],
  },
  {
    monthYear: "January 2024",
    totalPagesRead: 450,
    totalTimeMinutes: 22 * 60,
    totalSessions: 25,
    booksRead: [
      { title: "The Great Novel", pagesReadInMonth: 100, completedInMonth: true }, // 200 (Dec) + 100 (Jan) = 300 total
      { title: "Sci-Fi Adventure", pagesReadInMonth: 200, completedInMonth: false },
      { title: "Another Story", pagesReadInMonth: 150, completedInMonth: false }, // Let's assume it's a 250 page book, so not finished.
    ],
  },
  {
    monthYear: "February 2024",
    totalPagesRead: 250,
    totalTimeMinutes: 15 * 60,
    totalSessions: 18,
    booksRead: [
      { title: "Sci-Fi Adventure", pagesReadInMonth: 100, completedInMonth: false }, // 200 (Jan) + 100 (Feb) = 300. Assume book is 400 pages.
      { title: "Learning React", pagesReadInMonth: 150, completedInMonth: true } // 150 total pages
    ],
  },
];

export const MOCK_OVERALL_STATS: OverallStats = {
  totalBooks: 5,
  totalPagesRead: MOCK_BOOK_STATS_LIST.reduce((sum, book) => sum + book.totalPagesRead, 0), // Sum of all pages read from individual book stats
  totalTimeMinutes: MOCK_BOOK_STATS_LIST.reduce((sum, book) => sum + book.totalTimeMinutes, 0),
  totalSessions: MOCK_BOOK_STATS_LIST.reduce((sum, book) => sum + book.sessions, 0),
  readingActivity: [
    { date: 'Jan 01', pages: 50, time: 120 },
    { date: 'Jan 02', pages: 30, time: 90 },
    { date: 'Jan 03', pages: 70, time: 150 },
    { date: 'Jan 04', pages: 40, time: 100 },
    { date: 'Jan 05', pages: 60, time: 130 },
    { date: 'Jan 06', pages: 55, time: 110 },
    { date: 'Jan 07', pages: 45, time: 95 },
  ],
  pagesReadPerBook: MOCK_BOOK_STATS_LIST.map(book => ({ name: book.title, value: book.totalPagesRead })),
  timeSpentPerBook: MOCK_BOOK_STATS_LIST.map(book => ({ name: book.title, value: book.totalTimeMinutes })),
  monthlySummaries: MOCK_MONTHLY_SUMMARIES_DATA,
};
