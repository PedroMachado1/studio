
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from '@/components/core/AppShell';
import { FileLoadProvider } from '@/context/FileLoadContext';

export const metadata: Metadata = {
  title: 'KoReader Insight Web',
  description: 'Visualize your KoReader reading habits and progress.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <FileLoadProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
        </FileLoadProvider>
      </body>
    </html>
  );
}
