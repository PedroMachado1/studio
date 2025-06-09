
"use client";

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Clock, Repeat, CalendarDays, CheckCircle2 } from "lucide-react";
import type { BookStats } from "@/types/koreader";
import { format, isValid } from 'date-fns';
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

function formatDateSafe(dateInput?: Date | string | number): string {
  if (!dateInput) return "N/A";
  
  let date: Date | undefined;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    try {
      date = new Date(dateInput);
    } catch (e) {
      return "Invalid Date";
    }
  }

  if (!date || !isValid(date)) { 
    return "N/A";
  }
  try {
    return format(date, "MMM dd, yyyy");
  } catch (e) {
    console.error("Error formatting date:", dateInput, e);
    return "Invalid Date";
  }
}

export function BookCard({ book }: BookCardProps) {
  const isCompleted = book.totalPages > 0 && book.totalPagesRead >= book.totalPages;
  const progressPercentage = book.totalPages > 0 ? Math.min(100, Math.round((book.totalPagesRead / book.totalPages) * 100)) : 0;

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl font-headline text-primary leading-tight">{book.title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">Last read: {formatDateSafe(book.lastSessionDate)}</CardDescription>
          </div>
          {isCompleted && (
            <div className="flex items-center text-xs bg-accent/20 text-accent-foreground py-1 px-2 sm:px-2.5 rounded-full shrink-0 ml-2 whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 text-accent" />
              Completed
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 flex-grow pt-0">
        <div className="space-y-1">
            <div className="flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
                <span>Progress: {book.totalPagesRead.toLocaleString()} / {book.totalPages > 0 ? book.totalPages.toLocaleString() : 'N/A'} pages</span>
                <span className="font-medium text-foreground">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5 sm:h-2" aria-label={`${book.title} reading progress: ${progressPercentage}%`} />
        </div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <BookOpen className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
          <span>Pages Read: {book.totalPagesRead.toLocaleString()}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <Clock className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
          <span>Time Spent: {formatTime(book.totalTimeMinutes)}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <Repeat className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
          <span>Sessions: {book.sessions}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <CalendarDays className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent shrink-0" />
          <span>First Read: {formatDateSafe(book.firstSessionDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
