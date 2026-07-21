'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname(); // To clearly see which sidebar item is active!

  // Easy to miss but super important: Hide the sidebar entirely on auth pages!!
  if (pathname === '/login' || pathname === '/register') return null;

  // Bookshelf and Settings only to begin with but more can easily be added here
  const navItems = [
    {
      name: 'Reading Tracks',
      href: '/',
      icon: (
        // A simple, elegant "desk" or "home" icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Bookshelf',
      href: '/bookshelf',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  // Vibe coded, modeled after mock-ups by Stitch by Google
  return (
    <aside className="w-72 h-screen sticky top-0 flex flex-col bg-[#FCF9F2] border-r border-[#E5E0D8] shrink-0 overflow-hidden">

      {/* 1. TOP SECTION: Logo & Title */}
      <div className="pt-10 pb-8 flex flex-col items-center">
        {/* Placeholder for the olive branch logo */}
        <Link href={'/'}>
          <div className="w-16 h-16 rounded-lg bg-[#EFEBE1] border border-[#E5E0D8] flex items-center justify-center mb-4 shadow-sm">
            <span className="text-2xl opacity-80">🌿</span>
          </div>
        </Link>

        <Link href={'/'}>
          <h1 className="font-heading text-2xl text-[#2C302E] tracking-wide mb-1">
            Florilegium
          </h1>
        </Link>

        <h2 className="font-sans text-[9px] font-bold uppercase tracking-[0.25em] text-[#5C613E]">
          DIGITAL RENAISSANCE BOOK GARDEN
        </h2>
      </div>

      {/* 2. MIDDLE SECTION: Navigation Links */}
      <nav className="flex-1 flex flex-col w-full mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-8 py-3 transition-colors ${isActive
                ? 'bg-[#EFEBE1]/80 border-l-4 border-[#424B2E] text-[#2C302E]'
                : 'border-l-4 border-transparent text-[#5C613E] hover:bg-[#EFEBE1]/40 hover:text-[#2C302E]'
                }`}
            >
              <div className={isActive ? 'text-[#424B2E]' : 'opacity-70'}>
                {item.icon}
              </div>
              <span className="font-sans text-sm font-medium tracking-wide">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 3. BOTTOM SECTION: Actions & Footer */}
      <div className="px-6 pb-6 mt-auto">
        {/* Begin Session Button; wrapped in a relative container to position our tooltip */}
        <div className="group relative w-full mb-6">

          {/* 1. The Muted Button */}
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-2 bg-[#5C613E]/20 text-[#5C613E]/60 font-sans text-xs font-bold tracking-wider uppercase py-3 px-4 rounded-md cursor-not-allowed transition-all duration-300"
          >
            <span>▶</span> Start Reading Session
          </button>

          {/* 2. The Elegant "Coming Soon" Tooltip */}
          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded bg-[#2C302E] px-3 py-1.5 text-[10px] font-sans font-bold tracking-widest text-[#FCF9F2] uppercase opacity-0 transition-all duration-300 transform translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 shadow-md">
            Coming soon 🌱
            {/* Tiny tooltip arrow pointing down */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2C302E]" />
          </div>

        </div>

        {/* Help & Privacy Links */}
        <div className="flex justify-center gap-8 mb-6">
          <Link href="/help" className="flex flex-col items-center gap-1 group text-[#5C613E] hover:text-[#2C302E] transition-colors">
            <svg className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-sans text-[9px] uppercase tracking-widest font-semibold">Help</span>
          </Link>

          <Link href="/privacy" className="flex flex-col items-center gap-1 group text-[#5C613E] hover:text-[#2C302E] transition-colors">
            <svg className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-sans text-[9px] uppercase tracking-widest font-semibold">Privacy</span>
          </Link>
        </div>

        {/* Decorative Bottom Edge */}
        <div className="w-full h-16 bg-[#EFEBE1] rounded-lg opacity-50 overflow-hidden flex items-end justify-center pb-2">
          <span className="text-xl opacity-30">🌿</span>
        </div>
      </div>

    </aside>
  );
}