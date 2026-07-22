import Link from 'next/link';
import Image from 'next/image';
import { OPEN_LIBRARY_PAGE_SEARCH_RESULT_LIMIT as LIMIT } from '@/lib/constants';

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
          Search for titles, authors, or subjects to begin building your reading journey.
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

  // THE RESULTS GRID
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-8 py-12">
      <header className="mb-12 border-b border-[#E5E0D8] pb-6">
        <h1 className="text-4xl font-heading text-[#2C302E] mb-2">Search Results</h1>
        <p className="text-[#5C613E] font-sans text-sm font-medium tracking-wide uppercase">
          Showing results for &quot;{query}&quot; • {totalResults.toLocaleString()} works found
        </p>
      </header>

      <ul className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-0 m-0 list-none">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {searchResults.map((work: any) => {
          // DEFENSIVE DATA PARSING: Open Library data unfortunately.. is extremely messy haha!
          const title = work.title;
          const author = work.author_name ? work.author_name[0] : 'Unknown Author';
          const firstPublishYear = work.first_publish_year || 'Unknown Year';
          // Open Library keys look like "/works/OL12345W". We strip the prefix for our own routing
          const workId = work.key.replace('/works/', '');

          return (
            <Link key={work.key} href={`/book/${workId}`} className="group flex flex-col h-full">
              {/* Cover Image Container */}
              <div className="relative aspect-2/3 mb-3 border border-[#E5E0D8] rounded-md overflow-hidden bg-[#EFEBE1]/50 group-hover:border-[#5C613E]/50 group-hover:shadow-md transition-all duration-300">
                {work.cover_i ? (
                  <Image
                    src={`https://covers.openlibrary.org/b/id/${work.cover_i}-M.jpg`}
                    alt={`Cover of ${title}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <span className="font-heading text-[#2C302E] text-sm line-clamp-3">{title}</span>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-col grow">
                <h3 className="font-heading text-base text-[#2C302E] leading-tight mb-1 group-hover:text-[#5C613E] transition-colors line-clamp-2">
                  {title}
                </h3>
                <p className="font-sans text-xs text-[#5C613E] mb-1 line-clamp-1">{author}</p>
                <p className="font-serif italic text-[10px] text-[#5C613E]/70 mt-auto">{firstPublishYear}</p>
              </div>
            </Link>
          );
        })}
      </ul>

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