import type { Metadata } from 'next';
import { EB_Garamond, Source_Serif_4, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

// Load the fonts exactly as specified in your UI Kit (Screenshot_2026-07-06_16-49-39.png)
const ebGaramond = EB_Garamond({
  variable: '--font-eb-garamond',
  subsets: ['latin'],
});

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Book Momentum',
  description: 'Built with love by Steven :)',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Putthing suppressHydrationWarning both in the html *and* in the body, just like in the PokémonCollection Next.js re-build
    <html lang="en" suppressHydrationWarning className={`${ebGaramond.variable} ${sourceSerif.variable} ${inter.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex bg-[#FCF9F2] text-slate-800 font-serif">
        {/* Our Left Sidebar will go here */}
        {/* <Sidebar /> */}

        {/* Main Content Wrapper */}
        <div className="flex flex-1 flex-col">

          {/* Top Navbar for Search and Profile */}
          < Navbar />

          {/* 4. The actual page content (<Outlet /> equivalent) */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
