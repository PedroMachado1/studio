
import { BookMarked } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 sm:py-6 px-4 md:px-6 border-b border-border bg-card shadow-sm">
      <div className="container mx-auto flex items-center gap-2 sm:gap-3">
        <BookMarked className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
          KoReader Insight Web
        </h1>
      </div>
    </header>
  );
}
