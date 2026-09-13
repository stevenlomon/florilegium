import { Book, Author, Edition } from './types';
import { MAX_EDITIONS_FOR_PAGE_COUNT_ESTIMATE, MAX_EDITIONS_FOR_EDITION_SWITCHER, OPEN_LIBRARY_PAGE_SEARCH_RESULT_LIMIT as LIMIT } from './constants';

// For our communication with the Open Library (dropped Gutenberg) where we'll get all book data
const BASE_URL = 'https://openlibrary.org';
const COVER_BASE_URL = 'https://covers.openlibrary.org/b/id';

// Cache Limits and LRU Helpers (LRU = Least-Recently-Used)
const MAX_SEARCH_CACHE_SIZE = 100;
const MAX_BOOK_CACHE_SIZE = 200;
const MAX_EDITIONS_CACHE_SIZE = 500;

// I'm gonna allow myself to "just buy" this one
function setBoundedCache<K, V>(map: Map<K, V>, key: K, value: V, limit: number) {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= limit) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) {
      map.delete(oldestKey);
    }
  }
  map.set(key, value);
}

// Centralized "Desk Caches" for the entire Node environment
// We also centralize the artificial Labor Illusion latency logic to this single file! These are all conditionally applied 
// from this file now instead of several other files across the codebase
const searchDeskCache = new Map<string, Book[]>();
const bookDeskCache = new Map<string, Book>();
const editionsDeskCache = new Map<string, Edition[]>();
const archiveDeskCache = new Map<string, { searchResults: Record<string, unknown>[]; totalResults: number; totalPages: number }>();

// Small helper function so that we don't have to repeat headers
function getHeaders() {
  // Open Library requires no API key!

  return {
    'Content-Type': 'application/json',
    // Identifying our app per Open Library's request for better rate limits
    'User-Agent': 'Florilegium/1.0 (steven.lennartsson@gmail.com)'
  }
};

export const searchBooks = async (query: string, page = 1, limit = 5) => { // Keeping the exact same function defition like in the Pokémon project. Limit default dropped to 5 now with Open Library
  const normalizedQuery = query.toLowerCase().trim(); // We want the cache to cover both "Dune" and "dune"
  const cacheKey = `${normalizedQuery}-${page}-${limit}`;

  // Before doing anything, check cache!
    const cached = searchDeskCache.get(cacheKey);
    if (cached) {
      // In the three other API functions we add a "maintain trust delay" here. But the debouncing already has a 400ms delay built into it
      return { results: cached };
    }
  
  try {
    // I had *completely* misunderstood this function. This is not for the "retrieve all results for the hobbit" result; this
    // is for typing something in the navbar search and seeing the 5 title "sneak peak" dropdown!!!
    // The debounce already waits 400ms so natural latency *only* is the way to go here!

    const params = new URLSearchParams({
      q: normalizedQuery,
      page: page.toString(),
      limit: limit.toString(),
      fields: 'key,title,author_name,subject,cover_i,editions,editions.key,editions.number_of_pages' // We explicitly ask only for what we need. Now includes editions and page count
    });

    const res = await fetch(`${BASE_URL}/search.json?${params.toString()}`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 } // Combining our own cache with Next.js Data Cache!
    });

    if (!res.ok) {
      // If the API returns a 404 or 500, we throw our own clear error of type Error
      throw new Error(`Open Library API returned status: ${res.status}`);
    }

    const data = await res.json(); // Parse the external JSON from Open Library into a JS object. But we don't return yet!

    // Map Open Library's layout into our 'Book' type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedBooks: Book[] = (data.docs || []).map((doc: any) => { // `any` since it's 3rd party data
      // Open Library Keys look like "/works/OL27448W". We split and grab the actual ID.
      const rawId = doc.key ? doc.key.split('/').pop() : Math.random().toString();

      // Grab the "default" edition Open Library picked!
      const bestEdition = doc.editions?.docs?.[0];
      const editionId = bestEdition?.key ? bestEdition.key.split('/').pop() : null;

      return {
        id: rawId, // We keep the Work ID as the main ID
        title: doc.title || 'Unknown Title',
        authors: (doc.author_name || []).map((name: string) => ({ name })),
        subjects: doc.subject || [],
        summary: '', // Search API doesn't return summaries; we'll fetch this on the detailed view
        // If they have a cover_i (Cover ID), we manually construct the CDN URL
        // -M means Medium size. We use -L (Large) for the detailed view later.
        cover_image: doc.cover_i ? `${COVER_BASE_URL}/${doc.cover_i}-M.jpg` : '',
        // UPDATED: Filter out placeholders < 25 pages from search results. Also now returns `page_count_estimate` and `page_count_exact` rather than just `page_count`
        page_count_estimate: typeof bestEdition?.number_of_pages === 'number' && bestEdition.number_of_pages >= 25 ? bestEdition.number_of_pages : null,
        page_count_exact: null,
        default_edition_id: editionId,
      };
    });

    // Save to cache before returning, now using our bounded LRU
    setBoundedCache(searchDeskCache, cacheKey, mappedBooks, MAX_SEARCH_CACHE_SIZE);
    return { results: mappedBooks };

  } catch (error) {
    // Whether `error` is already of type Error or not, we log the raw, ugly error to the server console for US to debug
    console.error(`Server error fetching books using searchBooks:`, error);

    // Now; normalize the error so that the UI (our to-be-built `error.tsx`) always gets a predictable Error object
    if (error instanceof Error) {
      // If it is *already* of type Error...
      throw error; // ..simply toss it up the chain to the UI
    } else {
      // Else..
      throw new Error("An unexpected network error occurred while contacting Open Libary."); // ..create our own Error object
    }
  }
};

// This is the function I mistook `searchBooks` for. The logic for this function lived in /app/search/page.tsx, now it will live here.
// This is the "Full Catalog" search
export const searchArchive = async (query: string, page = 1) => {
  const normalizedQuery = query.toLowerCase().trim();
  const cacheKey = `${normalizedQuery}-${page}`;

  // Before doing anything, we check cache
  const cached = archiveDeskCache.get(cacheKey);
  if (cached) {
    // In all of three other cases where cached data *would* be served instantaneously (which deteriorates trust), 
    // we add a small 800ms / 1000ms / 1200ms artificial delay!
    await new Promise(resolve => setTimeout(resolve, 1200));
    return cached;
  }

  try {
    // This is the logic I had living in `searchBooks`. Conditional dynamic artificial latency!
    const TARGET_LATENCY = 2200; // The weighty 2.2s minimum latency for deep archive dives
    const startTime = Date.now();

    // We now explicitly restrict fields to avoid bloated responses and timeouts
    const params = new URLSearchParams({
      q: normalizedQuery, // We drop `encodeURIComponent` now that we have `URLSearchParams` to avoid double encoding
      page: page.toString(), // `page` and `limit` were parsed into strings in the earlier code eventually so might as 
      limit: LIMIT.toString(), // well pass them as strings to begin with
      fields: 'key,title,author_name,cover_i,first_publish_year,edition_count',
    });

    const res = await fetch(`${BASE_URL}/search.json?${params.toString()}`, {
        headers: getHeaders(),
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 3600 } // Combining our own cache with Next.js Data Cache!
      });

    if (!res.ok) {
      throw new Error('Failed to fetch search result data from Open Library');
    }

    const data = await res.json();
    const searchResults: Record<string, unknown>[] = data.docs || [];
    const totalResults = data.numFound || 0;
    const totalPages = Math.ceil(totalResults / LIMIT);

    const elapsed = Date.now() - startTime;
    if (elapsed < TARGET_LATENCY) {
      await new Promise((resolve) => setTimeout(resolve, TARGET_LATENCY - elapsed));
    }

    const payload = { searchResults, totalResults, totalPages };

    // Save to cache before returning, now using our bounded LRU
    setBoundedCache(archiveDeskCache, cacheKey, payload, MAX_SEARCH_CACHE_SIZE);

    return payload;
    
  } catch (error) {
    // Now standardized to use the same Error handling as searchBooks and the other API functions in this file
    console.error('Archive Search Error:', error);

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected network error occurred while contacting the archives.');
  }
}; 

// Rather than trying to do double duty grabbing Works *and* Editions, this API function now goes back to only focusing on Works. We outsource 
// the responsibility of fetching Editions to our new getEditionsForWork function below this one
export const getBookById = async (id: string): Promise<Book> => {
  // Before even jumping into the try and potentially fetching, check cache!
  const cached = bookDeskCache.get(id);
  if (cached) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return cached;
  }

  try {
    // There used to be rigid "blind" artificial Labor Illusion latency here. Natural latency *only* works perfectly good here!!

    let workId = id;
    let editionCoverUrl = '';

    if (id.toUpperCase().endsWith('M')) {
      try {
        const editionRes = await fetch(`${BASE_URL}/books/${id}.json`, {
          headers: getHeaders(),
        });
        if (editionRes.ok) {
          const editionData = await editionRes.json();
          if (editionData.works && editionData.works.length > 0 && editionData.works[0].key) {
            workId = editionData.works[0].key.split('/').pop();
          }
          if (editionData.covers && editionData.covers.length > 0) {
            editionCoverUrl = `${COVER_BASE_URL}/${editionData.covers[0]}-L.jpg`;
          }
        }
      } catch (error) {
        console.warn(`Could not resolve Edition ${id} to parent Work, falling back:`, error);
      }
    }

    const res = await fetch(`${BASE_URL}/works/${workId}.json`, {
      headers: getHeaders(),
    });

    if (!res.ok) throw new Error(`Open Library API returned status: ${res.status}`);

    const data = await res.json(); // Once again, we can't return yet. Open Library's data is.. extensive haha

    // Safely extract the summary (handling Open Library's string vs. object quirk)
    let summary = '';
    if (typeof data.description === 'string') {
      summary = data.description;
    } else if (data.description && data.description.value) {
      summary = data.description.value;
    }

    // Construct the Large (-L) cover image URL
    // To fix the bug in Issue #106, this may be overridden by edition fallback below. Some works only have covers at the Edition level!
    const coverId = data.covers && data.covers.length > 0 ? data.covers[0] : null;
    let coverUrl = coverId ? `${COVER_BASE_URL}/${coverId}-L.jpg` : ''; // Since this needs to be able to change if needed, it needs to be `let` now; not `const`!

    // Fetch Author Names in parallel using their Author Keys
    const authors: Author[] = [];
    if (data.authors && Array.isArray(data.authors)) {
      // Map over the author keys and fire off simultaneous fetch requests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const authorPromises = data.authors.map(async (a: any) => {
        if (a.author && a.author.key) {
          const authorRes = await fetch(`${BASE_URL}${a.author.key}.json`, {
            headers: getHeaders(),
          });
          if (authorRes.ok) {
            const authorData = await authorRes.json();
            return { name: authorData.name || 'Unknown Author' };
          }
        }
        return { name: 'Unknown Author' };
      });

      // Wait for all author names to return
      const resolvedAuthors = await Promise.all(authorPromises);
      authors.push(...resolvedAuthors);
    }

    // We actively hunt across up to 50 editions (this "magic number" is now a constant in lib/constants.ts) for a realistic average page count
    let pageCount: number | null = null;
    let pageCountExact: number | null = null; // We now also track the exact count of the Canon edition
    let defaultEditionId: string | undefined = undefined;
    let defaultIsbn: string | null = null; // Needed now that we want to show ISBN for the Defaul Edition

    try {
      const editionsRes = await fetch(`${BASE_URL}/works/${workId}/editions.json?limit=${MAX_EDITIONS_FOR_PAGE_COUNT_ESTIMATE}`, {
        headers: getHeaders(),
      });

      if (editionsRes.ok) {
        const editionsData = await editionsRes.json();
        const editions = editionsData.entries || [];

        // Filter out all editions that have valid page counts. Updated to now also filter out editions that have fewer than 25 pages to protect the average
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const editionsWithPages = editions.filter((ed: any) =>
          typeof ed.number_of_pages === 'number' && ed.number_of_pages >= 25
        );

        if (editionsWithPages.length > 0) {
          // Calculate the average page count across all valid editions
          const totalPages = editionsWithPages.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (sum: number, ed: any) => sum + ed.number_of_pages,
            0
          );
          const avgPages = totalPages / editionsWithPages.length;

          // Round average to nearest 50 (this constant will never change. I would argue that knowing that a work is approx. 375 pages for example is too granular and only adds unnessecary cognitive strain. It's 350 or 400. We also floor it at 50)
          pageCount = Math.max(50, Math.round(avgPages / 50) * 50);

          // Extract the ID and the ISBN from the best edition
          const bestEd = editionsWithPages[0];
          defaultEditionId = bestEd.key.split('/').pop();
          defaultIsbn = bestEd.isbn_13?.[0] || bestEd.isbn_10?.[0] || null;
          pageCountExact = bestEd.number_of_pages || null;

        } else if (editions.length > 0) {
          const fallbackEd = editions[0];
          defaultEditionId = fallbackEd.key.split('/').pop();
          defaultIsbn = fallbackEd.isbn_13?.[0] || fallbackEd.isbn_10?.[0] || null;
          pageCountExact = fallbackEd.number_of_pages || null;
        }

        // Fallback: if the Work itself has no cover, grab one from any edition
        if (!coverUrl) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const edWithCover = editions.find((ed: any) => ed.covers && ed.covers.length > 0);
          if (edWithCover) {
            coverUrl = `${COVER_BASE_URL}/${edWithCover.covers[0]}-L.jpg`;
          }
        }
      }
    } catch (error) {
      console.warn(`Could not fetch editions for Work ${workId}:`, error);
    }

    // Map everything back into our UI's expected Book type
    const finalBook = {
      id: id,
      title: data.title || 'Unknown Title',
      authors: authors.length > 0 ? authors : [{ name: 'Unknown Author' }],
      subjects: data.subjects || [],
      summary: summary,
      cover_image: editionCoverUrl || coverUrl,
      // Now returns `page_count_estimate` and `page_count_exact` rather than just `page_count`
      page_count_estimate: pageCount,
      page_count_exact: pageCountExact, // Not null anymore
      default_edition_id: defaultEditionId,
      // editions: mappedEditions, Outsourced now to getEditionsForWork below
      isbn: defaultIsbn, // But we do include the ISBN now for the default edition
    };

    // Cache it before returning. Now using our bounded LRU
    setBoundedCache(bookDeskCache, id, finalBook, MAX_BOOK_CACHE_SIZE);
    return finalBook;

  } catch (error) {
    console.error(`Server error fetching book details with id ${id} using getBookById:`, error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected network error occurred while contacting Open Library."); //
    }
  }
};

// Dedicated API function purely for fetching Editions for a Work using our new constant
// Now handles both Work IDs (ending in W) and Edition IDs (ending in M)
export const getEditionsForWork = async (identifier: string): Promise<Edition[]> => {
  // Before jumping into the try and potentially fetching, we check cache!
  const cached = editionsDeskCache.get(identifier);
  if (cached) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return cached;
  }

  try {
    // Flexible Labor Illusion! 
    const TARGET_LATENCY = 1400; // 1.4 seconds for editions
    const startTime = Date.now();

    let workId = identifier;

    // If the identifier is an Edition ID (typically ends with 'M'), resolve the parent Work ID first!
    if (identifier.toUpperCase().endsWith('M')) {
      const bookRes = await fetch(`${BASE_URL}/books/${identifier}.json`, {
        headers: getHeaders(),
        signal: AbortSignal.timeout(10000), // Enforce the same 10s timeout we use elsewhere
      });
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        if (bookData.works && bookData.works.length > 0 && bookData.works[0].key) {
          workId = bookData.works[0].key.split('/').pop();
        }
      }
    }

    // This fetch now remains completely untouched!
    const res = await fetch(`${BASE_URL}/works/${workId}/editions.json?limit=${MAX_EDITIONS_FOR_EDITION_SWITCHER}`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 3600 } // Combining our own cache with Next.js Data Cache!
    });

    if (!res.ok) throw new Error(`Open Library API returned status: ${res.status}`);

    const data = await res.json();
    const editions = data.entries || [];

    // Update to the filter: A complete edition now requires a cover scan for visual resonance and ISBN! Page count *not* required as
    // the user will fill in custom_page_count when assigning a book as Currently Reading!
    const completeEditions: Edition[] = editions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((ed: any) => ed && ed.key && ed.covers && ed.covers.length > 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((ed: any) => {
        const editionId = ed.key ? ed.key.split('/').pop() : Math.random().toString();
        const edCoverId = ed.covers[0];

        // Extract primary ISBN (prefer ISBN-13, fallback to ISBN-10)
        const primaryIsbn = ed.isbn_13?.[0] || ed.isbn_10?.[0] || null;

        return {
          id: editionId,
          title: ed.title || 'Unknown Title',
          cover_image_url: `${COVER_BASE_URL}/${edCoverId}-M.jpg`,
          // UPDATED: Treat anything under 25 pages as "Length unknown"
          page_count: typeof ed.number_of_pages === 'number' && ed.number_of_pages >= 25 ? ed.number_of_pages : null,
          publish_date: ed.publish_date || null,
          isbn: primaryIsbn,
        };
      });

    const elapsed = Date.now() - startTime;
    if (elapsed < TARGET_LATENCY) {
      await new Promise(resolve => setTimeout(resolve, TARGET_LATENCY - elapsed));
    }
    
    // Before returning, update our current session "Desk Cache" memory with the resource. Now using LRU!
    setBoundedCache(editionsDeskCache, identifier, completeEditions, MAX_EDITIONS_CACHE_SIZE);

    // And for editions we also index every individual edition in this list!
    for (const ed of completeEditions) {
      if (ed.id) {
        editionsDeskCache.set(ed.id, completeEditions);
      }
    }

    return completeEditions;
  } catch (error) {
    console.error(`Error fetching editions for identifier ${identifier}:`, error);
    // Surface the failure so the UI displays an **honest error** rather than a false zero-state
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected network error occurred while contacting Open Library.");
    }
  }
};