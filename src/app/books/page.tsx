
"use client";

import type React from 'react';
import { BookCard } from '@/components/core/BookCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFileLoad } from '@/context/FileLoadContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function BooksPage() {
  const { isFileLoaded, loadedStats } = useFileLoad();
  const books = loadedStats?.allBookStats;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-2xl sm:text-3xl font-bold font-headline mb-8 text-foreground">
        Your Books
      </h1>
      {!isFileLoaded ? (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              <CardTitle>No Data Loaded</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Please upload your KoReader metadata.sqlite file on the Reading Stats page first to see your books here.
            </CardDescription>
          </CardContent>
        </Card>
      ) : books && books.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {books.map((book) => (
              <BookCard key={book.title} book={book} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <Card className="shadow-lg">
           <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              <CardTitle>No Books Found</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Your KoReader data was processed, but no book information was found. Ensure your file contains reading history.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
