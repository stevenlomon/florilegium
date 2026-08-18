import { useState, useEffect, useRef } from 'react';
import type { Book } from '@/lib/types';

// The logic and useEffect for searching books is modularized since it will be used in a modal when picking Horizon books, not
// only in the Navbar. The use of Custom Hooks just clicked for me!
export function useBookSearch(errorLogPrefix = "Book search error:") {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null); // For the debouncing

  // I really wanna do a deep dive on how Abort Controller works. But not now
  const abortControllerRef = useRef<AbortController | null>(null);

  // Our useEffect to achieve debouncing. Mostly untouched compared to the Pokémon project, and now the core of a custom hook!
  useEffect(() => {
    // If the input is empty or too short, reset state and prevent fetching
    // We let derived state handle the wiping now, NO setState here!
    if (searchTerm.trim().length < 3) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // setIsSearching(true);
    // setError(null); Local state is NOT handled here anymore. Instead...

    // Clear previous timeout if user is still typing quickly
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If the user stops typing for 500ms, this runs
    timeoutRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // ...the local state updates is done *here*. This prevents synchronous cascading renders
      setIsSearching(true);
      setError(null);
      // Do the fetching business via our Proxy Route Handler
      try {
        // We want our API key securely on our server, never in the Browser. We don't use searchBooks directly here
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, { // Upgraded to using encodeURIComponent here. For example, if a user searched for "pride & prejudice", it becomes "pride%20%26%20prejudice" and not break the URL
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Proxy route returned status code: ${res.status}`);
        }

        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error(errorLogPrefix, err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 500);

    // And then the important cleanup. If the user types again before 500ms, this kills the previous timer
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, errorLogPrefix]); // Run every time there is a change in the searchTerm state variable. Now also errorLogPrefix since it makes an appearance

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    results,
    error,
  }
};