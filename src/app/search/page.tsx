import { Suspense } from 'react'; // For the "same page re-fetch"
import Link from 'next/link';
import SearchResultsGrid from '@/components/search/SearchResultGrid';
import { searchArchive } from '@/lib/api';
import SearchLoading from './loading';

// I have not noticed this until now which is kinda bonkers. If we're already on /search and enter something
// into the search bar and hit Enter.. we don't see the "Consulting the Archives"! We see the *old* search
// results as the new one is being requested!
// The solution: two components with a a `Suspense` wrapper on one of them! `Suspense` with `key={query-page}`
// forces React to destroy the old results and mount `loading.tsx` immediately when the URL query changes

// Our inner component! Takes care of the heavy fetching
async function SearchResultsContent({ query, page }: { query: string; page: number }) {
  
  // The entire code block with the endearing comments of me essentially learning about server side rendering and reflecting
  // on the Labor Illusion for the first time.. good times :) Visible on GitHub which kindly acts as a time capsule
  // All that logic is now moved to api.ts!
  const { searchResults, totalResults, totalPages } = await searchArchive(query, page);

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
    <>
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
            href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
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
            href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
          >
            Next
          </Link>
        ) : (
          <button className="cursor-not-allowed rounded-full border border-[#E5E0D8]/50 bg-transparent px-6 py-2 font-sans text-xs font-bold tracking-wider uppercase text-[#5C613E]/40" disabled>
            Next
          </button>
        )}
      </div>
    </>
  )
};

// Our outer component that has our original name and props!
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
  
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12">
      <Suspense key={`${query}-${page}`} fallback={<SearchLoading />}>
        <SearchResultsContent query={query} page={page} />
      </Suspense>
    </div>
  )
};