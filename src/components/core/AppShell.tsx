
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Header as PageHeader } from '@/components/core/Header';
import { BookMarked, LayoutDashboard, Library } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Reading Stats", icon: LayoutDashboard, dataTestId: "reading-stats-nav" },
    { href: "/books", label: "Books", icon: Library, dataTestId: "books-nav" },
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left" className="bg-sidebar">
        <SidebarHeader className="items-center p-4 border-b border-sidebar-border">
           <Link href="/" className="flex items-center gap-2 flex-grow min-w-0" data-testid="sidebar-logo-link">
              <BookMarked className="h-6 w-6 text-sidebar-primary shrink-0" />
              <span className="font-semibold text-lg text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
                KoInsight
              </span>
            </Link>
          <SidebarTrigger className="ml-auto group-data-[state=expanded]:text-sidebar-foreground group-data-[state=collapsed]:hidden" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right', align: 'center' }}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    data-testid={item.dataTestId}
                  >
                    <a>
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <PageHeader />
        <main className="flex-grow"> {/* Pages will handle their own padding/containers */}
          {children}
        </main>
        <footer className="py-4 px-4 md:px-6 border-t border-border bg-card">
            <div className="container mx-auto text-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} KoReader Insight Web. Demo.</p>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
