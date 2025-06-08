
"use client";

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Clock, Repeat, CalendarDays, CheckCircle2 } from "lucide-react";
import type { BookStats } from "@/types/koreader";
import { format } from 'date-fns';
import { Progress } from "@/components/ui/progress";

interface BookCardProps {
  book: BookStats;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function formatDateSafe(date?: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "N/A";
  }
  try {
    return format(date, "MMM dd, yyyy");
  } catch (e) {
    return "Invalid Date";
  }
}

export function BookCard({ book }: BookCardProps) {
  const isCompleted = book.totalPages > 0 && book.totalPagesRead >= book.totalPages;
  const progressPercentage = book.totalPages > 0 ? Math.round((book.totalPagesRead / book.totalPages) * 100) : 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-headline text-primary">{book.title}</CardTitle>
            <CardDescription>Last read: {formatDateSafe(book.lastSessionDate)}</CardDescription>
          </div>
          {isCompleted && (
            <div className="flex items-center text-xs bg-accent/20 text-accent-foreground py-1 px-2.5 rounded-full shrink-0 ml-2">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-accent" />
              Completed
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <div className="space-y-1">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Progress: {book.totalPagesRead.toLocaleString()} / {book.totalPages.toLocaleString()} pages</span>
                <span className="font-medium text-foreground">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" aria-label={`${book.title} reading progress: ${progressPercentage}%`} />
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="mr-2 h-4 w-4 text-accent" />
          <span>Pages Read: {book.totalPagesRead.toLocaleString()}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4 text-accent" />
          <span>Time Spent: {formatTime(book.totalTimeMinutes)}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Repeat className="mr-2 h-4 w-4 text-accent" />
          <span>Sessions: {book.sessions}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="mr-2 h-4 w-4 text-accent" />
          <span>First Read: {formatDateSafe(book.firstSessionDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
