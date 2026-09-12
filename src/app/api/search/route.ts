// Search Route Handler that acts as a Proxy between the Browser and the Open Library API. The Browser never calls Open Library directly!
// Same pattern I used in the Pokémon collector project

import { NextResponse } from 'next/server';
import { searchBooks } from '@/lib/api';
import { type Book } from '@/lib/types';

// Just like the Editions route.ts, Search gets its own dedicated "Desk Cache"
// However! This is not used in conjunction with an artificial Labor Illusion latency of our own, but instead
// *the natural latency* of querying Open Library! So cache is still really, really useful here!
const searchDeskCache = new Map<string, Book[]>();

export async function GET(request: Request) {
  // Extract the search term from the URL (e.g., /api/search?q=dune)
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  // Return early with an empty array if the query is missing or too short
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ results: [] }); 
  }

  // We want the cache to cover both "Dune" and "dune"
  const normalizedQuery = query.toLowerCase().trim();

  try {
    // Before calling our API function, check cache to potentially skip Open Library's natural latency!
    if (searchDeskCache.has(normalizedQuery)) {
      return NextResponse.json({ results: searchDeskCache.get(normalizedQuery) });
    }

    // Call our API function that communicates with Open Library here on the server, not in the Client Component Navbar
    const data = await searchBooks(normalizedQuery, 1, 5);

    // Save the results to our cache!
    const books = data.results || [];
    searchDeskCache.set(normalizedQuery, books);

    // Send the clean JSON back to the Browser (client component)
    return NextResponse.json({ results: books });
  } catch (error) {
    console.error("Search Route Handler Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
};