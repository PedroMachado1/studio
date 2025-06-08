
import type React from 'react';
import { OverallStats, MOCK_OVERALL_STATS } from "@/types/koreader";
import { MetricCard } from "./MetricCard";
import { ReadingChart } from "./ReadingChart";
import { BookOpen, Clock, Repeat, BarChart3, LineChart as LineChartIcon, BookCopy } from "lucide-react";

interface DashboardProps {
  data: OverallStats;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function Dashboard({ data }: DashboardProps) {
  const readingActivityDataKeys = [
    { name: "pages", color: "chart-1", icon: BookOpen },
    { name: "time", color: "chart-2", icon: Clock }
  ];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      {/* Overall Metrics */}
      <section aria-labelledby="overall-metrics-title">
        <h2 id="overall-metrics-title" className="text-2xl font-bold font-headline mb-6 text-foreground">Overall Statistics</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Books Read" value={data.totalBooks} icon={BookCopy} description="Number of unique books finished or started." />
          <MetricCard title="Total Pages Read" value={data.totalPagesRead.toLocaleString()} icon={BookOpen} description="Across all reading sessions." />
          <MetricCard title="Total Time Spent" value={formatTime(data.totalTimeMinutes)} icon={Clock} description="Total duration of reading." />
          <MetricCard title="Total Sessions" value={data.totalSessions} icon={Repeat} description="Number of distinct reading sessions." />
        </div>
      </section>

      {/* Reading Activity Chart */}
      <section aria-labelledby="reading-activity-title">
         <h2 id="reading-activity-title" className="sr-only">Reading Activity</h2>
        <ReadingChart
          title="Reading Activity Over Time"
          description="Pages read and time spent daily."
          data={data.readingActivity}
          chartType="line"
          dataKeys={readingActivityDataKeys}
          xAxisDataKey="date"
          icon={LineChartIcon}
        />
      </section>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {/* Pages Read Per Book Chart */}
        <section aria-labelledby="pages-per-book-title">
           <h2 id="pages-per-book-title" className="sr-only">Pages Per Book</h2>
          <ReadingChart
            title="Pages Read Per Book"
            data={data.pagesReadPerBook}
            chartType="bar"
            dataKeys={[{ name: "value", color: "chart-3" }]}
            xAxisDataKey="name"
            icon={BarChart3}
          />
        </section>

        {/* Time Spent Per Book Chart */}
        <section aria-labelledby="time-per-book-title">
          <h2 id="time-per-book-title" className="sr-only">Time Per Book</h2>
          <ReadingChart
            title="Time Spent Per Book (Minutes)"
            data={data.timeSpentPerBook}
            chartType="bar"
            dataKeys={[{ name: "value", color: "chart-4" }]}
            xAxisDataKey="name"
            icon={BarChart3}
          />
        </section>
      </div>
    </div>
  );
}
