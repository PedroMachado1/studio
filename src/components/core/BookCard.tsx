
"use client";

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Clock, Repeat, CalendarDays } from "lucide-react";
import type { BookStats } from "@/types/koreader";
import { format } from 'date-fns';

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
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">{book.title}</CardTitle>
        <CardDescription>Last read: {formatDateSafe(book.lastSessionDate)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
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
