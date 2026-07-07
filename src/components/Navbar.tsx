'use client' // Client component since we need to use `useState`, `useEffect`, etc etc

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // This replaces useNavigate
import type { Author, Book, OpenLibrarySearchResponse } from '@/lib/types';

export default function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [previews, setPreviews] = useState<Book[]>([]); // Array of our type Book
  const [isOpen, setIsOpen] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // For the debouncing
  const router = useRouter();

  // Our useEffect to achieve debouncing. Completely untouched compared to the Pokémon project!
  useEffect(() => {
    // Don't navigate to a search result page for an empty string AND also ensure we don't fire on strings shorter than 3 characters
    if (searchTerm.trim().length < 3) {
      setIsOpen(false);
      setPreviews([]);
      return;
    }

    // If the user stops typing for 500ms, this runs
    timeoutRef.current = setTimeout(async () => {
      // Handle local state
      setIsSearching(true);
      setIsOpen(true);

      // Do the fetching business via our Proxy Route Handler
      try {
        // We want our API key securely on our server, never in the Browser. We don't use searchBooks directly here
        const res = await fetch(`/api/search?q=${searchTerm}`); 
        if (!res.ok) throw new Error("Network response was not ok.");

        const data = await res.json();
        setPreviews(data.results || []);
      } catch (err) {
        console.error("Preview fetch failed", err);
        setPreviews([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    // And then the important cleanup. If the user types again before 500ms, this kills the previous timer
    return () => {
      if (timeoutRef.current) { 
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm]); // Run every time there is a change in the searchTerm state variable

  // We still need a form submission function; now typed
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) { //FormEvent, not SubmitEvent. React.FormEvent is *not* deprecated.
    e.preventDefault();

    if (!searchTerm.trim()) return; // Return early if there is no search term
    if (timeoutRef.current) clearTimeout(timeoutRef.current); //

    setIsOpen(false); // Local state management to prevent the curtains from staying open when we return
    router.push(`/search?q=${searchTerm}`);
  };

  // Vibe coded render block modeling the Pokémon project and styling for now
  return (
    <header className="sticky top-0 z-50 flex items-center justify-end px-8 py-4 bg-[#FCF9F2]">
      
      <div className="relative flex items-center gap-6">
        {/* SEARCH FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center rounded-md bg-[#EFEBE1] px-4 py-2 border border-transparent transition-all focus-within:border-[#424B2E] focus-within:ring-1 focus-within:ring-[#424B2E]"
        >
          {/* Simple search icon to be replaced by a proper SVG later */}
          <span className="text-[#5C613E] mr-3 opacity-70">
            {isSearching ? '⏳' : '🔍'}
          </span>
          <input
            className="w-72 bg-transparent text-sm font-sans text-[#2C302E] outline-none placeholder:text-[#5C613E]"
            type="text"
            placeholder="Search library..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Hidden submit button to allow Enter key to work */}
          <button type="submit" className="sr-only">Search</button>
        </form>

        {/* PROFILE BUTTON */}
        <button 
          className="h-9 w-9 rounded-full bg-[#424B2E] text-[#FCF9F2] flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
          title="Profile"
        >
          <span className="text-sm font-sans">👤</span>
        </button>

        {/* THE DROPDOWN */}
        {isOpen && (
          <div className="absolute right-14 top-[calc(100%+10px)] z-100 w-96 overflow-hidden rounded-md border border-[#E5E0D8] bg-white shadow-lg">
            {isSearching ? (
              <p className="m-0 p-4 text-center font-sans text-sm text-[#5C613E]">Searching the archives...</p>
            ) : previews.length > 0 ? (
              <ul className="m-0 flex flex-col p-0 list-none">

                {previews.map((book) => (
                  <li key={book.id} className="border-b border-[#E5E0D8] last:border-b-0">
                    <Link
                      href={`/book/${book.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex flex-col p-3 transition-colors hover:bg-[#FCF9F2]"
                    >
                      {/* Book Title in EB Garamond */}
                      <strong className="text-[#2C302E] font-heading font-normal text-lg leading-tight">
                        {book.title}
                      </strong>
                      {/* Author in Inter */}
                      <small className="text-[#5C613E] font-sans text-xs mt-1">
                        {book.authors?.[0]?.name || 'Unknown Author'}
                      </small>
                    </Link>
                  </li>
                ))}

                {/* The "See all results" footer */}
                <li className="bg-[#EFEBE1]/50 text-center">
                  <Link
                    href={`/search?q=${searchTerm}`}
                    onClick={() => setIsOpen(false)}
                    className="block p-3 font-sans text-sm font-medium text-[#424B2E] transition-colors hover:bg-[#E5E0D8]"
                  >
                    See all results for "{searchTerm}"
                  </Link>
                </li>
              </ul>
            ) : (
              <p className="m-0 p-4 text-center font-sans text-sm text-[#5C613E]">No works found in the catalog.</p>
            )}
          </div>
        )}
      </div>
    </header>
  );
};