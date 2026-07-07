// Search Route Handler that acts as a Proxy between the Browser and the Open Library API. The Browser never calls Open Library directly!
// Same pattern I used in the Pokémon collector project

import { NextResponse } from 'next/server';
import { searchBooks } from '@/lib/api';

export async function GET(request: Request) {
  // Extract the search term from the URL (e.g., /api/search?q=dune)
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  // Return early with an empty array if the query is missing or too short
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ results: [] }); 
  }

  try {
    // Call our API function that communicates with Open Library here on the server, not in the Client Component Navbar
    const data = await searchBooks(query, 1, 5);

    // Send the clean JSON back to the Browser (client component)
    return NextResponse.json(data);
  } catch (err) {
    console.error("Search Route Handler Error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
};