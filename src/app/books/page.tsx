
"use client";

import type React from 'react';
import { BookCard } from '@/components/core/BookCard';
import { MOCK_BOOK_STATS_LIST } from '@/types/koreader';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function BooksPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold font-headline mb-8 text-foreground">
        Your Books
      </h1>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MOCK_BOOK_STATS_LIST.map((book) => (
            <BookCard key={book.title} book={book} />
          ))}
          {/* Add more books or a message if empty */}
        </div>
      </ScrollArea>
    </div>
  );
}
