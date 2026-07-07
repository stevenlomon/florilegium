import { Book } from './types';

// For our communication with the Open Library (dropped Gutenberg) where we'll get all book data
const BASE_URL = 'https://openlibrary.org';
const COVER_BASE_URL = 'https://covers.openlibrary.org/b/id';

// Small helper function so that we don't have to repeat headers
function getHeaders() {
  // Open Library requires no API key!

  return {
    'Content-Type': 'application/json',
    // Identifying our app per Open Library's request for better rate limits
    'User-Agent': 'BookMomentum/1.0 (steven.lennartsson@gmail.com)'
  }
};

export const searchBooks = async (query: string, page = 1, limit = 5) => { // Keeping the exact same function defition like in the Pokémon project. Limit default dropped to 5 now with Open Library
  try {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString(),
      fields: 'key,title,author_name,subject,cover_i' // We explicitly ask only for what we need
    });

    const res = await fetch(`${BASE_URL}/search.json?${params.toString()}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      // If the API returns a 404 or 500, we throw our own clear error of type Error
      throw new Error(`Open Library API returned status: ${res.status}`);
    }

    const data = await res.json(); // Parse the external JSON from Gutenberg into a JS object. But we don't return yet!

    // Map Open Library's layout into our 'Book' type
    const mappedBooks: Book[] = (data.docs || []).map((doc: any) => { // `any` since it's 3rd party data
      // Open Library Keys look like "/works/OL27448W". We split and grab the actual ID.
      const rawId = doc.key ? doc.key.split('/').pop() : Math.random().toString();
      
      return {
        id: rawId,
        title: doc.title || 'Unknown Title',
        authors: (doc.author_name || []).map((name: string) => ({ name })),
        subjects: doc.subject || [],
        summary: '', // Search API doesn't return summaries; we'll fetch this on the detailed view
        // If they have a cover_i (Cover ID), we manually construct the CDN URL
        // -M means Medium size. We use -L (Large) for the detailed view later.
        cover_image: doc.cover_i ? `${COVER_BASE_URL}/${doc.cover_i}-M.jpg` : ''
      };
    });

    return { results: mappedBooks };
  
  } catch(err) {
    // Whether `err` is already of type Error or not, we log the raw, ugly error to the server console for US to debug
    console.error(`Server error fetching books using searchBooks:`, err);

    // Now; normalize the error so that the UI (our to-be-built `error.tsx`) always gets a predictable Error object
    if (err instanceof Error) { 
      // If it is *already* of type Error...
      throw err; // ..simply toss it up the chain to the UI
    } else {
      // Else..
      throw new Error("An unexpected network error occurred while contacting Open Libary."); // ..create our own Error object
    }
  }
};

export const getBookById = async (id: number) => { // Id is a number in this API! Not a string
  try {
    const res = await fetch(`${BASE_URL}/books/${id}`, {
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error(`Gutenberg API returned status: ${res.status}`);
    
    return res.json();
  } catch (err) {
    console.error(`Server error fetching book details with id ${id} using getBookById:`, err);

    if (err instanceof Error) { 
      throw err; //
    } else {
      throw new Error("An unexpected network error occurred while contacting Gutenberg."); //
    }
  }
};