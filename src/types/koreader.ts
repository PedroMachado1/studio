
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
  totalPagesRead: number;
  totalTimeMinutes: number;
  sessions: number;
  firstSessionDate?: Date;
  lastSessionDate?: Date;
}

export interface OverallStats {
  totalBooks: number;
  totalPagesRead: number;
  totalTimeMinutes: number;
  totalSessions: number;
  readingActivity: { date: string; pages: number; time: number }[]; 
  pagesReadPerBook: { name: string, value: number }[];
  timeSpentPerBook: { name: string, value: number }[];
}

export const MOCK_OVERALL_STATS: OverallStats = {
  totalBooks: 5,
  totalPagesRead: 1250,
  totalTimeMinutes: 30 * 60, // 30 hours
  totalSessions: 75,
  readingActivity: [
    { date: 'Jan 01', pages: 50, time: 120 },
    { date: 'Jan 02', pages: 30, time: 90 },
    { date: 'Jan 03', pages: 70, time: 150 },
    { date: 'Jan 04', pages: 40, time: 100 },
    { date: 'Jan 05', pages: 60, time: 130 },
    { date: 'Jan 06', pages: 55, time: 110 },
    { date: 'Jan 07', pages: 45, time: 95 },
  ],
  pagesReadPerBook: [
    { name: "The Great Novel", value: 300 },
    { name: "Another Story", value: 250 },
    { name: "Sci-Fi Adventure", value: 400 },
    { name: "Mystery Tales", value: 150 },
    { name: "Learning React", value: 150 },
  ],
  timeSpentPerBook: [
    { name: "The Great Novel", value: 720 }, 
    { name: "Another Story", value: 600 }, 
    { name: "Sci-Fi Adventure", value: 900 },
    { name: "Mystery Tales", value: 360 },
    { name: "Learning React", value: 420 }, 
  ],
};

export const MOCK_BOOK_STATS_LIST: BookStats[] = [
  {
    title: "The Great Novel",
    totalPagesRead: 300,
    totalTimeMinutes: 720, // 12 hours
    sessions: 15,
    firstSessionDate: new Date("2023-01-10T10:00:00Z"),
    lastSessionDate: new Date("2023-01-25T18:30:00Z"),
  },
  {
    title: "Another Story",
    totalPagesRead: 250,
    totalTimeMinutes: 600, // 10 hours
    sessions: 10,
    firstSessionDate: new Date("2023-02-05T14:00:00Z"),
    lastSessionDate: new Date("2023-02-20T20:00:00Z"),
  },
  {
    title: "Sci-Fi Adventure",
    totalPagesRead: 400,
    totalTimeMinutes: 900, // 15 hours
    sessions: 20,
    firstSessionDate: new Date("2023-03-01T09:00:00Z"),
    lastSessionDate: new Date("2023-03-28T22:00:00Z"),
  },
  {
    title: "Mystery Tales",
    totalPagesRead: 150,
    totalTimeMinutes: 360, // 6 hours
    sessions: 8,
    firstSessionDate: new Date("2023-04-12T11:00:00Z"),
    lastSessionDate: new Date("2023-04-25T16:30:00Z"),
  },
  {
    title: "Learning React",
    totalPagesRead: 150,
    totalTimeMinutes: 420, // 7 hours
    sessions: 25,
    firstSessionDate: new Date("2023-05-01T08:00:00Z"),
    lastSessionDate: new Date("2023-05-30T17:00:00Z"),
  },
];
