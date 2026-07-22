'use client' // Client component since we need to use `useState`, `useEffect`, etc etc

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // This replaces useNavigate
import { useBookSearch } from '@/hooks/useBookSearch';

export default function Navbar() {
  // With the hook now, the only local state the Navbar needs to manage itself is whether its own dropdown is visible
  const [isOpen, setIsOpen] = useState(false);

  // Our hook variables! `results` gets the alias `previews` here in the Navbar
  const { searchTerm, setSearchTerm, isSearching, results: previews } = useBookSearch("Navbar Search Error:");

  const router = useRouter();

  // Easy to miss but super important: Hide the navbar entirely on auth pages!!
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/register') return null;

  // We still need a form submission function; now typed
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) { //FormEvent, not SubmitEvent. React.FormEvent is *not* deprecated.
    e.preventDefault();

    if (!searchTerm.trim()) return; // Return early if there is no search term
    // if (timeoutRef.current) clearTimeout(timeoutRef.current); // Not needed here anymore

    setIsOpen(false); // Local state management to prevent the curtains from staying open when we return
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`); // Also upgraded to use encodeURIComponent, see comment in useBookSearch
  };

  // A new handler specifically for when the user types in the input box; this is the one that handles setIsOpen now, not the useEffect
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // If they type enough characters, immediately open the dropdown
    if (e.target.value.trim().length >= 3) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-end px-8 py-4 bg-[#FCF9F2]">

      <div className="relative flex items-center gap-6">
        {/* SEARCH FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center rounded-md bg-[#EFEBE1] px-4 py-2 border border-transparent transition-all focus-within:border-[#424B2E] focus-within:ring-1 focus-within:ring-[#424B2E]"
        >
          {/* SEARCH ICON & LOADING STATE */}
          <span className="text-[#5C613E] mr-3 opacity-70 flex items-center justify-center">
            {isSearching ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E5E0D8] border-t-current"></div>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            )}
          </span>
          <input
            className="w-72 bg-transparent text-sm font-sans text-[#2C302E] outline-none placeholder:text-[#5C613E]"
            type="text"
            placeholder="Search the archives..."
            value={searchTerm}
            onChange={handleInputChange} // Not `(e) => setSearchTerm(e.target.value)` anymore, but our new handler
          />
          {/* Hidden submit button to allow Enter key to work */}
          <button type="submit" className="sr-only">Search</button>
        </form>

        {/* PROFILE BUTTON */}
        <Link
          href='/profile'
          className="group h-9 w-9 rounded-full bg-[#EFEBE1] border border-[#E5E0D8] text-[#5C613E] flex items-center justify-center transition-all duration-300 hover:bg-[#424B2E] hover:text-[#FCF9F2] hover:border-[#424B2E] shadow-sm"
          title="Profile"
        >
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>

        {/* THE DROPDOWN */}
        {isOpen && (
          <div className="absolute right-14 top-[calc(100%+10px)] z-100 w-96 overflow-hidden rounded-md border border-[#E5E0D8] bg-white shadow-lg">
            {isSearching ? (
              <p className="m-0 p-4 text-center font-sans text-sm text-[#5C613E]">Searching the archives...</p>
            ) : previews.length > 0 ? (
              <div className="flex flex-col max-h-[70vh]">

                {/* 1. Scrollable Results List */}
                <ul className="m-0 flex flex-col p-0 list-none overflow-y-auto bg-[#FCF9F2]">
                  {previews.map((book) => (
                    <li key={book.id} className="border-b border-[#E5E0D8] last:border-b-0">
                      <Link
                        href={`/book/${book.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col p-3 transition-colors hover:bg-[#EFEBE1]/60"
                      >
                        <strong className="text-[#2C302E] font-heading font-normal text-lg leading-tight group-hover:text-[#424B2E]">
                          {book.title}
                        </strong>
                        <small className="text-[#5C613E] font-sans text-xs mt-1">
                          {book.authors?.[0]?.name || 'Unknown Author'}
                          {book.page_count && <span className="opacity-50"> • {book.page_count} pages</span>}
                        </small>
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* 2. Unified Footer Area (White background to separate from the list) */}
                <div className="bg-white border-t border-[#E5E0D8] p-3 flex flex-col gap-3">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchTerm)}`}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-2 bg-[#EFEBE1]/50 rounded text-[#424B2E] font-sans text-[11px] font-bold uppercase tracking-widest hover:bg-[#E5E0D8] transition-colors"
                  >
                    Explore all works for &quot;{searchTerm}&quot;
                  </Link>

                  <p className="text-[10px] font-serif italic text-[#5C613E]/60 text-center">
                    All book data provided by{' '}
                    <a
                      href='https://archive.org/donate/?platform=ol'
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#424B2E] not-italic font-sans text-[9px] font-bold tracking-widest underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] transition-colors mx-0.5"
                    >
                      Open Library
                    </a>
                    .
                  </p>
                </div>

              </div>
            ) : (
              <p className="m-0 p-4 text-center font-sans text-sm text-[#5C613E]">No works found in the catalog.</p>
            )}
          </div>
        )}
      </div>
    </header>
  );
};