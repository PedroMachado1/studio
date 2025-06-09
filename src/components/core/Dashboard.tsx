
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { OverallStats, type MonthlyReadingSummary, type BookStats } from "@/types/koreader";
import { MetricCard } from "./MetricCard";
import { ReadingChart } from "./ReadingChart";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Repeat, BarChart3, LineChart as LineChartIcon, BookCopy, CalendarClock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardProps {
  data: OverallStats;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function Dashboard({ data }: DashboardProps) {
  const readingActivityDataKeys = [
    { name: "pages", color: "chart-1", icon: BookOpen },
    { name: "time", color: "chart-2", icon: Clock }
  ];

  const { monthlySummaries, allBookStats } = data || {};
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [currentMonthData, setCurrentMonthData] = useState<MonthlyReadingSummary | null>(null);

  useEffect(() => {
    if (monthlySummaries && monthlySummaries.length > 0) {
      const months = [...monthlySummaries].map(s => s.monthYear).reverse();
      setAvailableMonths(months);
      if (!selectedMonth || !months.includes(selectedMonth)) {
        setSelectedMonth(months[0]);
      }
    } else {
      setAvailableMonths([]);
      setSelectedMonth('');
      setCurrentMonthData(null);
    }
  }, [monthlySummaries, selectedMonth]);

  useEffect(() => {
    if (selectedMonth && monthlySummaries && monthlySummaries.length > 0) {
      const foundData = monthlySummaries.find(s => s.monthYear === selectedMonth);
      setCurrentMonthData(foundData || null);
    } else if (!selectedMonth || !monthlySummaries || monthlySummaries.length === 0) {
      setCurrentMonthData(null);
    }
  }, [selectedMonth, monthlySummaries]);


  if (!data) {
    return null; 
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      {/* Overall Metrics */}
      <section aria-labelledby="overall-metrics-title">
        <h2 id="overall-metrics-title" className="text-xl sm:text-2xl font-bold font-headline mb-6 text-foreground">Overall Statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Books Read" value={data.totalBooks} icon={BookCopy} description="Number of unique books finished or started." />
          <MetricCard title="Total Pages Read" value={data.totalPagesRead.toLocaleString()} icon={BookOpen} description="Across all reading sessions." />
          <MetricCard title="Total Time Spent" value={formatTime(data.totalTimeMinutes)} icon={Clock} description="Total duration of reading." />
          <MetricCard title="Total Sessions" value={data.totalSessions} icon={Repeat} description="Number of distinct reading sessions." />
        </div>
      </section>

      {/* Monthly Reading Summary Section */}
      {monthlySummaries && monthlySummaries.length > 0 && allBookStats && (
        <section aria-labelledby="monthly-summary-title">
          <div className="flex items-center gap-2 mb-6 mt-10">
            <CalendarClock className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <h2 id="monthly-summary-title" className="text-xl sm:text-2xl font-bold font-headline text-foreground">
              Monthly Reading Summary
            </h2>
          </div>
          <div className="mb-6">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full max-w-xs shadow">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentMonthData && (
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="font-headline text-primary">Summary for {currentMonthData.monthYear}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <MetricCard title="Pages Read" value={currentMonthData.totalPagesRead.toLocaleString()} icon={BookOpen} />
                  <MetricCard title="Time Spent" value={formatTime(currentMonthData.totalTimeMinutes)} icon={Clock} />
                  <MetricCard title="Sessions" value={currentMonthData.totalSessions} icon={Repeat} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Books Active This Month</h3>
                  {currentMonthData.booksRead.length > 0 ? (
                    <ul className="space-y-4">
                      {currentMonthData.booksRead.map((bookActivity, index) => {
                        const overallBookStat = allBookStats.find(b => b.title === bookActivity.title);
                        const percentage = overallBookStat && overallBookStat.totalPages > 0 
                          ? Math.round((overallBookStat.totalPagesRead / overallBookStat.totalPages) * 100) 
                          : 0;

                        return (
                          <li 
                            key={index} 
                            className="text-sm text-muted-foreground p-4 bg-card rounded-md shadow-sm space-y-2"
                          >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <span className="font-semibold text-base text-foreground">{bookActivity.title}</span>
                              {bookActivity.completedInMonth && (
                                <span className="flex items-center text-xs bg-accent/20 text-accent-foreground py-0.5 px-2 rounded-full self-start sm:self-center">
                                  <Check className="h-3.5 w-3.5 mr-1 text-accent" /> Completed this month
                                </span>
                              )}
                            </div>
                            <p>Pages this month: <span className="font-medium text-foreground">{bookActivity.pagesReadInMonth.toLocaleString()}</span></p>
                            {overallBookStat && (
                              <>
                                <p>Overall: <span className="font-medium text-foreground">{overallBookStat.totalPagesRead.toLocaleString()} / {overallBookStat.totalPages > 0 ? overallBookStat.totalPages.toLocaleString() : 'N/A'} pages</span></p>
                                <div className="flex items-center gap-2">
                                  <Progress value={percentage} className="w-full h-2" aria-label={`${percentage}% complete`} />
                                  <span className="text-xs font-medium text-foreground">{percentage}%</span>
                                </div>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific books tracked for this month in the demo data.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Reading Activity Chart */}
      <section aria-labelledby="reading-activity-title">
         <h2 id="reading-activity-title" className="sr-only">Reading Activity</h2>
        <ReadingChart
          title="Reading Activity Over Time"
          description="Pages read and time spent daily."
          data={data.readingActivity || []}
          chartType="line"
          dataKeys={readingActivityDataKeys}
          xAxisDataKey="date"
          icon={LineChartIcon}
        />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Pages Read Per Book Chart */}
        <section aria-labelledby="pages-per-book-title">
           <h2 id="pages-per-book-title" className="sr-only">Pages Per Book</h2>
          <ReadingChart
            title="Pages Read Per Book"
            data={data.pagesReadPerBook || []}
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
            data={data.timeSpentPerBook || []}
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


    
