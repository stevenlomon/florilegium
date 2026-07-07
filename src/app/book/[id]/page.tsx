import { getBookById } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import AddToBookshelfButton from '@/components/AddToBookshelfButton';

export default async function DetailedViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookById(id);

  // Fallback if the API returns nothing
  if (!book) {
    return (
      <main className="min-h-screen p-8 max-w-5xl mx-auto flex items-center justify-center">
        <p className="font-sans text-[#5C613E]">Work not found in the archives.</p>
      </main>
    );
  }

  // Vibe coded render statement for now to keep momentum. Still turned out really pretty! AI these days, maaaan haha
  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <Link href="/" className="inline-block mb-8 text-[#5C613E] hover:text-[#2C302E] font-sans text-sm transition-colors">
        ← Return to Library
      </Link>

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

        <div className="w-full md:w-2/3 flex flex-col">
          <h1 className="text-4xl font-heading font-normal text-[#2C302E] mb-2 leading-tight">
            {book.title}
          </h1>

          {/* METADATA ROW: Author, Pages, and Edition */}
          <div className="flex flex-wrap items-center gap-3 text-sm font-sans text-[#5C613E] mb-6">
            <span className="text-lg text-[#2C302E]">{book.authors?.[0]?.name || 'Unknown Author'}</span>

            {book.page_count ? (
              <>
                <span className="opacity-50">•</span>
                <span>{book.page_count} pages</span>
              </>
            ) : (
              <>
                <span className="opacity-50">•</span>
                <span className="italic text-[#5C613E]/70 font-serif">
                  Page count missing for this edition
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
            <p className="font-serif text-[#2C302E] leading-relaxed">
              {book.summary || "No summary available for this work."}
            </p>
          </div>

          <div className="mt-auto pt-4 flex flex-wrap gap-4">
            < AddToBookshelfButton book={book} />
            <button className="bg-transparent border border-[#424B2E] text-[#424B2E] font-sans text-sm font-medium tracking-wide px-6 py-2.5 rounded hover:bg-[#EFEBE1] transition">
              Something else to be added here
            </button>
          </div>
        </div>
      </article>
    </main>
  )
};