'use client';
// The interactive part of the Detailed View Page as a dedicated Client Component that will be imported into the Page Server Component!

import { useState } from 'react';
import Image from 'next/image';
import { type Book, type Edition } from '@/lib/types';
import AddToBookshelfButton from './AddToBookshelfButton';
import ExpandableSummary from './ExpandableSummary';
import EditionSwitcherModal from '../shared/EditionSwitcherModal';

interface BookDetailsClientProps {
  book: Book;
  isAlreadyInBookshelf: boolean;
}

export default function BookDetailsClient({ book, isAlreadyInBookshelf }: BookDetailsClientProps) {
  // State to hold the explicitly chosen edition. 
  // If null, we default to the Work-level averages and fallbacks.
  const [activeEdition, setActiveEdition] = useState<Edition | null>(null);

  // State for the new Edition Switcher Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New state of tracking image loading errors
  const [imageFailed, setImageFailed] = useState(false);

  // Derived Display Values: If we have an active edition, use its data. Otherwise, fall back to the Work data.
  const displayTitle = activeEdition?.title || book.title;
  const displayCover = activeEdition?.cover_image_url || book.cover_image || null; // Now null instead of falling back to via.placeholder.com
  // const displayPages = activeEdition?.page_count || book.page_count; Handled on its own below
  const displayIsbn = activeEdition?.isbn || book.isbn;

  // Rather than just displayPages, we now implement the new core logic for Issue #104
  const estimatePages = book.page_count_estimate;
  const exactPages = activeEdition?.page_count || book.page_count_exact;

  // We construct a derived Book object to pass to the AddToBookshelfButton
  // so it saves the *exact* edition ID and data to Postgres instead of the Work ID.
  const bookToSave: Book = {
    ...book,
    id: activeEdition ? activeEdition.id : book.id,
    title: displayTitle,
    cover_image: displayCover || '',
    // page_count: displayPages,
    page_count_estimate: estimatePages,
    page_count_exact: exactPages,
  };

  return (
    <>
      <article className="flex flex-col md:flex-row gap-10 bg-white/50 border border-[#E5E0D8] p-8 rounded-lg shadow-sm">

        {/* LEFT COLUMN: Cover */}
        <div className="w-full md:w-1/3 shrink-0">
          {/* UPDATED: New improved Image Fallback Logic */}
          {displayCover && !imageFailed ? (
            <Image
              key={displayCover} // Force Image to re-render if the URL changes
              src={displayCover}
              alt={`Cover of ${displayTitle}`}
              width={400}
              height={600}
              // priority={true}
              loading="eager"
              fetchPriority="high" // The `priority`property has been deprecated! These two lines replaces it
              className="w-full h-auto rounded shadow-sm object-cover border border-[#E5E0D8] transition-all duration-300"
              onError={() => setImageFailed(true)} // Catch the Open Library 503s!
            />
          ) : (
            <div className="w-full aspect-2/3 rounded shadow-sm border border-[#E5E0D8] bg-[#EFEBE1]/50 flex flex-col items-center justify-center p-6 text-center">
              <h3 className="font-heading text-2xl text-[#2C302E] leading-tight line-clamp-4 mb-2">{displayTitle}</h3>
              <p className="font-sans text-sm text-[#5C613E] line-clamp-2">{book.authors?.[0]?.name || 'Unknown Author'}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Metadata & Summary */}
        <div className="w-full md:w-2/3 flex flex-col min-w-0">
          <h1 className="text-4xl font-heading font-normal text-[#2C302E] mb-2 leading-tight transition-all duration-300">
            {displayTitle}
          </h1>

          {/* METADATA ROW */}
          <div className="flex flex-wrap items-center gap-3 text-sm font-sans text-[#5C613E] mb-6">
            <span className="text-lg text-[#2C302E]">{book.authors?.[0]?.name || 'Unknown Author'}</span>

            {/* The new Tactile Hover Page Count Logic */}
            {(estimatePages || exactPages) ? (
              <>
                <span className="opacity-50">•</span>
                {/* The group relative wrapper for the tooltip */}
                <div className="group relative flex items-center cursor-help outline-none" tabIndex={0}>
                  {/* We use a subtle dotted underline to indicate interactivity if an exact count is hidden beneath */}
                  <span className={`underline-offset-4 ${exactPages ? 'underline decoration-dotted decoration-[#5C613E]/50' : ''}`}>
                    {estimatePages ? `ca ${estimatePages} pages` : `${exactPages} pages`}
                  </span>
                  
                  {/* The Hover Tooltip (Only renders if an exact count exists!) */}
                  {exactPages && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded bg-[#2C302E] px-3 py-1.5 text-[10px] font-sans font-bold tracking-widest text-[#FCF9F2] uppercase opacity-0 transition-all duration-300 transform translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 shadow-md z-10">
                      Exact printing: {exactPages} pages
                      {/* Tiny tooltip arrow pointing down */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2C302E]" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="opacity-50">•</span>
                <span className="italic text-[#5C613E]/70 font-serif">Length unknown</span>
              </>
            )}

            {/* New ISBN Display */}
            {displayIsbn && (
              <>
                <span className="opacity-50">•</span>
                <span className="font-mono text-xs tracking-tighter">ISBN: {displayIsbn}</span>
              </>
            )}

            <>
              <span className="opacity-50"> </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[#424B2E] font-medium underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] hover:text-[#2C302E] transition-colors text-xs tracking-wide uppercase"
              >
                Switch Edition
              </button>
            </>
          </div>

          {/* SUBJECT TAGS */}
          <div className="flex flex-wrap gap-2 mb-8">
            {book.subjects?.slice(0, 4).map((subject: string, idx: number) => (
              <span key={idx} className="bg-[#EFEBE1] text-[#424B2E] text-xs font-sans px-3 py-1 rounded-full">
                {subject.split(' -- ')[0]}
              </span>
            ))}
          </div>

          {/* SUMMARY */}
          <div className="mb-8">
            <h3 className="font-sans text-xs tracking-wider text-[#5C613E] uppercase mb-3 border-b border-[#E5E0D8] pb-2">
              Summary
            </h3>
            <ExpandableSummary text={book.summary} />
          </div>

          {/* ACTIONS */}
          <div className="mt-auto pt-6 w-full">
            <AddToBookshelfButton book={bookToSave} isAlreadyInBookshelf={isAlreadyInBookshelf} />
          </div>
        </div>
      </article>

      {/* EDITION SWITCHER MODAL */}
      <EditionSwitcherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workId={book.id}
        currentEditionId={activeEdition?.id}
        onSelectEdition={(edition) => {
          setActiveEdition(edition);
          setIsModalOpen(false);
          setImageFailed(false); // Put here rather than in the useEffect for the same reason as in BookDetailsModal; to avoid the "anti-pattern" that leads to the "Cascading Render" error I wanna do a deep dive on
        }}
      />
    </>
  )
};