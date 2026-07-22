import { getBookById } from '@/lib/api';
import { checkBookInBookshelf } from '@/lib/db/bookshelf';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation'; // This is new and super super useful!
import AddToBookshelfButton from '@/components/detail-page/AddToBookshelfButton';
import ExpandableSummary from '@/components/detail-page/ExpandableSummary';
import BackButton from '@/components/detail-page/BackButton';

export default async function DetailedViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // const book = await getBookById(id);
  // Rather than trying to grab book directly, we're gonna do it systematically to ensure no full black error screen
  let book;
  try {
    book = await getBookById(id);
  } catch (error) {
    // If there is an error in finding the book id or the user enters an invalid gibberish id, notFound intercepts the 
    // request and redirects them to our custom 404 page at not-found.tsx! Next.js keeps impressing me
    notFound();
  }

  // With the book fetched server side, we can now run this server side check to see if it's in the user's bookshelf or not
  // using our new Data Access Layer function! Which will be passed as a new prop to the client component
  const isAlreadyInBookshelf = await checkBookInBookshelf(id);

  // Fallback if the API returns nothing
  if (!book) {
    return (
      <main className="min-h-screen p-8 max-w-5xl mx-auto flex items-center justify-center">
        <p className="font-sans text-[#5C613E]">Work not found in the archives.</p>
      </main>
    );
  }

  return (
    // The main outer card is now a bit wider to be able to properly contain all the data, especially summaries that go bonkers bananas haha
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Now using our new Client Component! */}
      <BackButton />

      <article className="flex flex-col md:flex-row gap-10 bg-white/50 border border-[#E5E0D8] p-8 rounded-lg shadow-sm">

        <div className="w-full md:w-1/3 shrink-0">
          <Image
            src={book.cover_image || 'https://via.placeholder.com/400x600?text=No+Cover'}
            alt={`Cover of ${book.title}`}
            width={400}
            height={600}
            priority={true}
            className="w-full h-auto rounded shadow-sm object-cover border border-[#E5E0D8]"
          />
        </div>

        {/* min-w-0 added here to stop the column from blowing out */}
        <div className="w-full md:w-2/3 flex flex-col min-w-0">
          <h1 className="text-4xl font-heading font-normal text-[#2C302E] mb-2 leading-tight">
            {book.title}
          </h1>

          {/* METADATA ROW: Author, Pages, and Edition */}
          <div className="flex flex-wrap items-center gap-3 text-sm font-sans text-[#5C613E] mb-6">
            <span className="text-lg text-[#2C302E]">{book.authors?.[0]?.name || 'Unknown Author'}</span>

            {book.page_count ? (
              <>
                <span className="opacity-50">•</span>
                <span>ca {book.page_count} pages</span>
              </>
            ) : (
              <>
                <span className="opacity-50">•</span>
                <span className="italic text-[#5C613E]/70 font-serif">
                  Length unknown
                </span>
              </>
            )}

            <>
              <span className="opacity-50">•</span>
              <button
                disabled
                className="text-[#424B2E] font-medium underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] hover:text-[#2C302E] transition-colors cursor-not-allowed opacity-90 text-xs tracking-wide uppercase"
                title="Edition switching coming soon"
              >
                Switch Edition
              </button>
            </>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {book.subjects?.slice(0, 4).map((subject: string, idx: number) => (
              <span key={idx} className="bg-[#EFEBE1] text-[#424B2E] text-xs font-sans px-3 py-1 rounded-full">
                {subject.split(' -- ')[0]}
              </span>
            ))}
          </div>

          <div className="mb-8">
            <h3 className="font-sans text-xs tracking-wider text-[#5C613E] uppercase mb-3 border-b border-[#E5E0D8] pb-2">
              Summary
            </h3>
            {/* Replaced the <p> tag with our new Client Component */}
            <ExpandableSummary text={book.summary} />
          </div>

          <div className="mt-auto pt-6 w-full">
            <AddToBookshelfButton book={book} isAlreadyInBookshelf={isAlreadyInBookshelf} />
          </div>
        </div>
      </article>
    </main>
  )
};