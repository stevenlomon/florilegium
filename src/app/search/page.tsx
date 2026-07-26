import Link from 'next/link';
import Image from 'next/image';
import { OPEN_LIBRARY_PAGE_SEARCH_RESULT_LIMIT as LIMIT } from '@/lib/constants';
import SearchResultsGrid from '@/components/search/SearchResultGrid';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string, page?: string }>; }) {
  const params = await searchParams;
  const query = params.q;
  const page = parseInt(params.page || "1");

  // EMPTY QUERY STATE
  if (!query) {
    return (
      <div className="mt-32 text-center flex flex-col items-center px-4">
        <h2 className="mb-3 text-3xl font-heading text-[#2C302E]">The Library is open.</h2>
        <p className="text-[#5C613E] font-serif italic max-w-md">
          Search for titles, authors, or subjects to begin nurturing your reading journey.
        </p>
        <p className="mt-12 text-[#5C613E]/60 font-sans text-xs uppercase tracking-widest font-semibold max-w-md">
          &quot;When in doubt, go to the library.&quot; <br className="hidden sm:block" />— Hermione Granger
        </p>
      </div>
    )
  };

  // DATA FETCHING (Pure Server-Side!)
  // Open Library Search API natively supports pagination via &page=
  // And as for Next.js when it comes to pagination, the URL is our state! There is no `useState`! And since we are using the URL and 
  // nothing else as the state for pagination, everything that is organic for the web just.. works! Bookmarking, sharing and using the 
  // browser's native and ancient Back and Forward all work out the box because every page turn is a real URL navigation!
  
  // Introducing artificial "Labor illusion" latency (1.2) seconds. If we *didn't* have this line of code here... the app would be able
  // to show us 658 results of "The Hobbit" faster than I can blink. That's what it felt like haha! There *needs* to be some latency! Or
  // else I simply won't trust it!! This all ties to the "Labor Effect" which is a real and really fascinating psychological phenomenon!
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&page=${page}&limit=${LIMIT}`, {
    // We cache search results for an hour to keep the app fast and respect Open Library's servers
    // The search result data is stored in teh Next.js Data Cache (essentially, the hard drive/memory of the server running our app,
    // which in the case of Florilegium will be Vercel!)
    next: { revalidate: 3600 }
    // With the line above, my brain connected the dot to `revalidatePath`. The difference is that this is *Time-based Revalidation*. We 
    // use it for 3rd party APIs where data doesn't change by the second
    // `revalidatePath('/bookshelf')` as an example would tell the server "Hey, the user just updated their bookshelf! Throw away your
    // cached version of the bookshelf page and fetch fresh data right this instance". This would be an example of *On-Demand Revalidation*
  });

  if (!res.ok) {
    throw new Error("Failed to fetch search result data from Open Library");
  }

  const data = await res.json();
  const searchResults = data.docs || [];
  const totalResults = data.numFound || 0;
  const totalPages = Math.ceil(totalResults / LIMIT);

  // ZERO RESULTS STATE
  if (searchResults.length === 0) {
    return (
      <div className="mt-32 text-center flex flex-col items-center">
        <h2 className="mb-3 text-3xl font-heading text-[#2C302E]">No works found</h2>
        <p className="text-[#5C613E] font-serif max-w-md">
          We couldn&apos;t find any matches for &quot;{query}&quot;. Try adjusting your search terms.
        </p>
      </div>
    );
  }

  // Fully vibe coded return render statement
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12">
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading text-[#2C302E] mb-2">Search Results</h1>
        <p className="text-[#5C613E] font-sans text-sm font-medium tracking-wide uppercase">
          Showing results for &quot;{query}&quot; • {totalResults.toLocaleString()} works found
        </p>
      </header>

      {/* The actual Search Result Grid: Now its own dedicated Client Component! */}
      <SearchResultsGrid searchResults={searchResults} />

      {/* PAGINATION CONTROLS */}
      <div className="mt-16 flex items-center justify-center gap-4">
        {page > 1 ? (
          <Link
            className="rounded-full border border-[#E5E0D8] bg-[#FCF9F2] px-6 py-2 font-sans text-xs font-bold tracking-wider uppercase text-[#2C302E] transition-all hover:-translate-y-0.5 hover:bg-[#EFEBE1] hover:shadow-sm"
            href={`/search?q=${query}&page=${page - 1}`}
          >
            Previous
          </Link>
        ) : (
          <button className="cursor-not-allowed rounded-full border border-[#E5E0D8]/50 bg-transparent px-6 py-2 font-sans text-xs font-bold tracking-wider uppercase text-[#5C613E]/40" disabled>
            Previous
          </button>
        )}

        {page < totalPages ? (
          <Link
            className="rounded-full border border-[#E5E0D8] bg-[#FCF9F2] px-6 py-2 font-sans text-xs font-bold tracking-wider uppercase text-[#2C302E] transition-all hover:-translate-y-0.5 hover:bg-[#EFEBE1] hover:shadow-sm"
            href={`/search?q=${query}&page=${page + 1}`}
          >
            Next
          </Link>
        ) : (
          <button className="cursor-not-allowed rounded-full border border-[#E5E0D8]/50 bg-transparent px-6 py-2 font-sans text-xs font-bold tracking-wider uppercase text-[#5C613E]/40" disabled>
            Next
          </button>
        )}
      </div>
    </div>
  )
};