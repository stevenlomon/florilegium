'use client'

import { useState } from 'react';
import Image from 'next/image';
import { type BookshelfItem } from '@/lib/types';
import BookDetailsModal from './BookDetailsModal';

interface BookshelfClientProps {
  initialBooks: BookshelfItem[];
}

const TABS = [
  { id: 'all', label: 'All Books' },
  { id: '1', label: 'Intend to Read' },
  { id: '2', label: 'Currently Reading' }, // "Since we don't allow the user to assign Currently Reading from the Bookshelf, there's no reason to show the filter! It's all managed from the Reading Tracks UI!" Fair. But it causes confusion and cognitive dissonance when the math doesn't add up. Plus! Past code ensures that users can't change its "Currently Reading" status from the Bookshelf UI. And even tho "Currently Reading" is now visible as a dynamic Filter Tab, we still can't change Read status to "Currently Reading" from a book in the Bookshelf that is currently not of that status!
  { id: '3', label: 'Read' },
  { id: '4', label: 'Dropped' }
];

// A simple array to map our slots to Roman Numerals
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

// 3 distinct organic squish shapes
const WAX_SHAPES = [
  "rounded-[45%_55%_32%_68%_/_60%_35%_65%_40%]", // Heavy bottom-right squish
  "rounded-[61%_39%_55%_45%_/_42%_58%_42%_58%]", // Top-left flared
  "rounded-[38%_62%_63%_37%_/_41%_44%_56%_59%]", // Scalloped 5-lobe feel
] as const;

// 4 organic tilt angles
const WAX_ROTATIONS = [
  "-rotate-3",
  "rotate-4",
  "-rotate-6",
  "rotate-2",
] as const;

export default function BookshelfClient({ initialBooks }: BookshelfClientProps) {
  const [activeTab, setActiveTab] = useState('all'); // Defaults to 'all', is set to '1', '2', '3', or '4' by the Filtering button onClick
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null); // Updated to just store the Id and not the entire object. See why below

  // New state for tracking Open Library image failures
  const [failedImages, setFailedImages] = useState<string[]>([]);

  // In order to have router.refresh() work properly as intended in the modal, it serves us more to *not* have `books` be a state variable!
  const books = initialBooks;

  // Derive the actual book object on the fly! When router.refresh() brings in new data, this automatically finds the fresh version
  // Essentially another change to have router.refresh() work properly as intended in the model haha!
  const selectedBook = books.find(b => b.bookshelf_item_id === selectedBookId) || null;

  // Filter books based on the active tab. What is ultimately rendered in the return render statement is not `books`, but this filtered
  // `filteredBooks` array!
  const filteredBooks = books.filter(book => {
    // The array `.filter()` method takes a boolean condition to do the filtering. Everything that *satisfies* the condition is let 
    // through by the "gateway filter" condition. If activeTab is 'all', we let the gateway condition be `true`, a condition that *always*
    // evaluates to.. `true` haha! *All* elements of the array are let through meaning `filteredBooks` is a perfect copy of `books`
    if (activeTab === 'all') return true;

    // But only if activeTab is 'all'! Otherwise, we use the more intuitive "gateway filter" condition
    return book.status_id.toString() === activeTab;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E0D8] pb-4">
        {TABS.map((tab) => {
          // Derive the counts dynamically from the data we've already extracted from the database!
          const count = tab.id === 'all'
            ? books.length
            : books.filter(b => b.status_id.toString() === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${activeTab === tab.id
                ? 'bg-[#424B2E] text-white shadow-sm'
                : 'bg-white/50 text-[#5C613E] hover:bg-[#EFEBE1]'
                }`}
            >
              {tab.label} <span className="opacity-70 text-xs ml-1">({count})</span>
            </button>
          )
        })}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {filteredBooks.map((book, index) => { // Grab the index for the `priority` property in the Image component (to silence a warning, see below)

          // We now check if this specific book cover has failed
          const hasFailed = failedImages.includes(book.bookshelf_item_id);

          return (
            <div
              key={book.bookshelf_item_id}
              className="flex flex-col gap-3 group cursor-pointer"
              onClick={() => setSelectedBookId(book.bookshelf_item_id)} // Now takes the Id, not the entire object
            >
              {/* Cover */}
              <div className="relative aspect-2/3 rounded-md overflow-hidden border border-[#E5E0D8] hover:border-[#5C613E] hover:shadow-lg transition-all shadow-sm bg-[#FCF9F2]">

                {/* NEW: The Florilegium Wax Seal */}
                {book.horizon_slot && (() => {
                  // Use modulo to cycle through shapes & rotations predictably based on slot number
                  const slotIndex = book.horizon_slot - 1;
                  const shapeClass = WAX_SHAPES[slotIndex % WAX_SHAPES.length];
                  const rotateClass = WAX_ROTATIONS[slotIndex % WAX_ROTATIONS.length];

                  return (
                    <div
                      className={`absolute top-2.5 left-2.5 w-[46px] h-[46px] z-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 origin-center ${rotateClass}`}
                      title={`Horizon Masterpiece (Slot ${book.horizon_slot})`}
                    >
                      {/* 1. The Wax Base - Dynamic organic shape */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br from-[#9b2a2a] via-[#822424] to-[#521111] ${shapeClass} shadow-[2px_4px_8px_rgba(0,0,0,0.5),_inset_1.5px_1.5px_2px_rgba(255,255,255,0.3),_inset_-3px_-3px_6px_rgba(0,0,0,0.75)]`}
                      />

                      {/* 2. The Specular Sheen - Uses matching shapeClass so highlights line up */}
                      <div
                        className={`absolute inset-0 ${shapeClass} bg-gradient-to-b from-white/15 via-white/5 to-transparent mix-blend-overlay pointer-events-none`}
                      />

                      {/* 3. The Stamped Impression - Fixed circular core */}
                      <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-[#621616] via-[#7d2020] to-[#8d2424] border border-[#4a1010]/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),_inset_0_-1px_2px_rgba(255,255,255,0.25),_0_1px_2px_rgba(0,0,0,0.3)]" />

                      {/* 4. Floral Engraving */}
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="absolute inset-0 w-full h-full scale-[0.62] text-[#EFEBE1] opacity-90 drop-shadow-[-1px_-1px_0px_rgba(255,255,255,0.2)] drop-shadow-[1px_2px_1px_rgba(0,0,0,0.85)]"
                      >
                        <path d="M5.5 10c0 3 2 5.5 5 6.5-1.5-1-2.5-3-2.5-5 0-1.5.5-2.5 1-3.5-1.5.5-3.5 1-3.5 2z" />
                        <path d="M4 14c0 2 1.5 4 4 4.5-1-.5-2-2-2-3.5 0-1 .5-2 1-2.5-1.5.5-3 1-3 1.5z" />
                        <path d="M18.5 10c0 3-2 5.5-5 6.5 1.5-1 2.5-3 2.5-5 0-1.5-.5-2.5-1-3.5 1.5.5 3.5 1 3.5 2z" />
                        <path d="M20 14c0 2-1.5 4-4 4.5 1-.5 2-2 2-3.5 0-1-.5-2-1-2.5 1.5.5 3 1 3 1.5z" />
                        <path d="M12 18.5c-1 1-2 2-2 3.5h4c0-1.5-1-2.5-2-3.5z" />
                      </svg>

                      {/* 5. The Embossed Roman Numeral */}
                      <span
                        className="relative font-serif font-bold text-[13px] text-[#EFEBE1] tracking-tighter select-none"
                        style={{ textShadow: '-1px -1px 0px rgba(255,255,255,0.2), 1px 2px 2px rgba(0,0,0,0.9)' }}
                      >
                        {ROMAN_NUMERALS[book.horizon_slot - 1] || book.horizon_slot}
                      </span>
                    </div>
                  );
                })()}

                {/* UPDATED: Swap to the fallback if the image throws an error */}
                {book.cover_image_url && !hasFailed ? (
                  <Image
                    src={book.cover_image_url}
                    alt={`Cover of ${book.title}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    priority={index < 10} // Tell Next.js to prioritize loading the first 10 covers! To silence "[browser] Image with src "https://covers.openlibrary.org/b/id/14566393-L.jpg" was detected as the Largest Contentful Paint (LCP). Please add the `loading="eager"` property if this image is above the fold." warning
                    onError={() => setFailedImages((prev) => [...prev, book.bookshelf_item_id])} // onError is a native property of `Image`!
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#EFEBE1]/50">
                    <h3 className="font-heading text-lg text-[#2C302E] leading-tight line-clamp-3 mb-2">{book.title}</h3>
                    <p className="font-sans text-xs text-[#5C613E] line-clamp-2">{book.author}</p>
                  </div>
                )}

                {/* Optional: Future home of the recommendation badge or rating stars */}
                {book.status_id === 3 && book.user_rating && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm flex items-center gap-1">
                    <span className="text-[10px] font-bold text-[#424B2E]">★ {book.user_rating}</span>
                  </div>
                )}
              </div>

              {/* Metadata underneath */}
              <div>
                <h3 className="font-heading text-base text-[#2C302E] leading-tight line-clamp-1 group-hover:text-[#424B2E] transition-colors">
                  {book.title}
                </h3>
                <p className="font-sans text-[11px] text-[#5C613E] mt-1 line-clamp-1">
                  {book.author}
                </p>
              </div>
            </div>
          )
        })}

        {filteredBooks.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-70">
            <span className="text-4xl mb-4">🌿</span>
            <p className="text-[#5C613E] font-serif italic">No books found in this section.</p>
          </div>
        )}
      </div>

      {/* The new modal at the very end of the return render statement */}
      <BookDetailsModal
        key={selectedBookId || 'empty-modal'} // To handle the edge case "What happens if a user opens broken cover Book A (setting `imageFailed` to `true`, closes it, and then opens good cover Book B?" In this scenario, `imageFailed` would still be `true`! When a `key` changes, React completely destroys the old component instance and builds a fresh one, wiping *all* stale state clean. 'empty-modal' is a completely arbitrary string
        isOpen={!!selectedBook} // Only open if there IS selectedBook. The double `!!`, called "Double Bang" is essentially a neat shorthand in this scenario of writing `isOpen={selectedBook !== null ? true : false}`
        onClose={() => setSelectedBookId(null)}
        book={selectedBook}
      />
    </div>
  )
};