
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext'; // Added
import { AuthButton } from '@/components/AuthButton';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; // Added

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MTE Goal Tracker',
  description: 'Track your soccer team performance',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={100}>
            <LanguageProvider> {/* Added LanguageProvider */}
              <AuthProvider>
                <div className="min-h-screen flex flex-col">
                  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                      <a className="flex items-center space-x-2" href="/">
                        <span className="font-bold">MTE U10</span>
                      </a>
                      <div className="flex items-center gap-2">
                        <LanguageSwitcher /> {/* Added LanguageSwitcher */}
                        <ThemeToggle />
                        <AuthButton />
                      </div>
                    </div>
                  </header>
                  <main className="flex-1 p-4 container max-w-5xl mx-auto">
                    {children}
                  </main>
                </div>
                <Toaster />
              </AuthProvider>
            </LanguageProvider> {/* Added LanguageProvider */}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
