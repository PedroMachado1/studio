
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
