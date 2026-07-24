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

  // Derived Display Values: If we have an active edition, use its data. Otherwise, fall back to the Work data.
  const displayTitle = activeEdition?.title || book.title;
  const displayCover = activeEdition?.cover_image_url || book.cover_image || 'https://via.placeholder.com/400x600?text=No+Cover';
  const displayPages = activeEdition?.page_count || book.page_count;
  const displayIsbn = activeEdition?.isbn || book.isbn;

  // We construct a derived Book object to pass to the AddToBookshelfButton
  // so it saves the *exact* edition ID and data to Postgres instead of the Work ID.
  const bookToSave: Book = {
    ...book,
    id: activeEdition ? activeEdition.id : book.id,
    title: displayTitle,
    cover_image: displayCover,
    page_count: displayPages,
  };

  return (
    <>
      <article className="flex flex-col md:flex-row gap-10 bg-white/50 border border-[#E5E0D8] p-8 rounded-lg shadow-sm">

        {/* LEFT COLUMN: Cover */}
        <div className="w-full md:w-1/3 shrink-0">
          <Image
            key={displayCover} // Force Image to re-render if the URL changes
            src={displayCover}
            alt={`Cover of ${displayTitle}`}
            width={400}
            height={600}
            priority={true}
            className="w-full h-auto rounded shadow-sm object-cover border border-[#E5E0D8] transition-all duration-300"
          />
        </div>

        {/* RIGHT COLUMN: Metadata & Summary */}
        <div className="w-full md:w-2/3 flex flex-col min-w-0">
          <h1 className="text-4xl font-heading font-normal text-[#2C302E] mb-2 leading-tight transition-all duration-300">
            {displayTitle}
          </h1>

          {/* METADATA ROW */}
          <div className="flex flex-wrap items-center gap-3 text-sm font-sans text-[#5C613E] mb-6">
            <span className="text-lg text-[#2C302E]">{book.authors?.[0]?.name || 'Unknown Author'}</span>

            {displayPages ? (
              <>
                <span className="opacity-50"> </span>
                <span>{activeEdition ? '' : 'ca '}{displayPages} pages</span>
              </>
            ) : (
              <>
                <span className="opacity-50"> </span>
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
        }}
      />
    </>
  )
};