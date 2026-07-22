'use client'

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type TrackBook } from '@/lib/types';
import { useRouter } from 'next/navigation';

// Intended behavior: We will have an input field that the user interacts with on a card when they hover over it with the mouse. This
// could potentially introduce a UX nightmare: the user inputs their current_page integer. They accidentally move the mouse away from the
// card. They hover over the card again. Their input is gone. 
// To be fair, a current_page integer is a super small inconvenience to enter again - it would be much worse if they had written their raw 
// thoughts for a notes input (I'll tackle that later) - but built up and accumulated, this micro frustration would build up into the user 
// not wanting to use the product at all anymore. 
// The solution: 
// * If they hover over the card and *don't* click on the input field to interact with it, there is no noticeable difference to
//   what we already have. 
// * If they hover over the card and *do* click on the input field to interact with it, the hover locks into place and it *does not unlock
// until the user either:
//    1. clicks "UPDATE PROGRESS" or press Enter (commit)
//    2. or remove their input and click away    (cancel)

// With this new input, the "FINISH BOOK" button is also not a button anymore, it is de-prioritized as a secondary action so that the user 
// doesn't accidentally finishes the book. A significant milestone in a reading journey should never share equal visual weight with a routine 
// Tuesday evening page update!
interface ReadingTrackCardProps {
  book: TrackBook;
  isCurrentlyReading: boolean;
  onFinishBook: (e: React.MouseEvent) => void;
  onShelveBook: (e: React.MouseEvent) => void;
  isFinishing: boolean;
}

export default function ReadingTrackCard({ book, isCurrentlyReading, onFinishBook, onShelveBook, isFinishing }: ReadingTrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false); // New state for the new unassigning action!

  // This was an unexpected UX obstance; it needs to be able to be an empty string! Otherwise, when we remove all our input, it defaults to 0 
  // and self-inserts this. If we remove 49 in order to write 56 real quick, it wouldn't become 56, it would become 056. This would drive
  // people insane over time haha
  const [pageInput, setPageInput] = useState<number | string>(book.current_page || 0);

  const total = book.custom_page_count || book.page_count || 0;

  // Instead of calculating the progress bar's width based on the live keystrokes (pageInput), we calculate it using the static truth passed down 
  // from the server (book.current_page). It will only visually snap into place after the router.refresh() brings down the new data
  const percentage = total > 0 ? Math.min(100, Math.round(((book.current_page || 0) / total) * 100)) : 0;

  // Our core logic: The overlay is visible if the mouse is over it, OR if the user has clicked the input.
  const showOverlay = isHovered || isLocked;

  const router = useRouter();

  async function handleUpdateProgress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsUpdating(true);

    // Safety fallback: if they submit an empty string, save it as 0
    const finalPageToSave = pageInput === '' ? 0 : Number(pageInput);

    try {
      const res = await fetch('/api/journey', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: book.bookshelf_item_id,
          current_page: finalPageToSave
        })
      });

      if (!res.ok) {
        throw new Error("Failed to update progress");
      }

      // Success! Release the lock and tell the server to update the UI
      setIsLocked(false);
      router.refresh();
    } catch (err) {
      console.error("Error saving progress:", err);
      // Escape hatch: If the network fails, revert the input back to the database truth
      setPageInput(book.current_page || 0);
      alert("Failed to save progress. Please try again.");
    } finally {
      // Always unlock the button, whether the fetch succeeded or failed!
      setIsUpdating(false);
    }
  }

  return (
    <div
      // The CSS hover scaling is conditional and based on whether or not we show the overlay
      // It shrinks back to regular size only on commit or cancel
      className={`group relative block w-full aspect-2/3 rounded-md border border-[#E5E0D8] bg-[#FCF9F2] origin-bottom transition-all duration-300 ${isCurrentlyReading
        ? (showOverlay ? 'scale-112 z-50 shadow-2xl cursor-default' : 'scale-100 z-10 shadow-sm cursor-default')
        : 'hover:scale-106 hover:border-[#5C613E] hover:shadow-md hover:z-20 transition-all z-10' // hover:scale-106 and hover:z-20 added here
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* COVER IMAGE (Remains a link only if NOT currently reading, or if the overlay is hidden) */}
      <Link
        href={`/book/${book.external_id || book.book_id}`}
        className={`absolute inset-0 ${showOverlay ? 'pointer-events-none' : ''}`} // Disable link clicks when overlay is active
      >
        {book.cover_image_url ? (
          <Image
            src={book.cover_image_url}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 768px) 50vw, 15vw"
            priority={true}
            className="object-cover w-full h-full transition-transform duration-500" // group-hover:scale-105 removed from here to avoid double-scaling
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#EFEBE1]/50 border-4 border-transparent group-hover:border-white/20 transition-all">
            <h3 className="font-heading text-base text-[#2C302E] leading-tight line-clamp-3 mb-2">{book.title}</h3>
            <p className="font-sans text-[10px] text-[#5C613E] line-clamp-2">{book.author}</p>
          </div>
        )}
      </Link>

      {/* HOVER OVERLAY (ONLY FOR SLOT 1) */}
      {isCurrentlyReading && (
        <div className={`absolute inset-0 bg-[#2C302E]/90 flex flex-col p-4 transition-all duration-300 ${showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>

          <form onSubmit={handleUpdateProgress} className="flex flex-col items-center justify-center my-auto w-full">
            <span className="text-[10px] font-sans tracking-widest text-[#FCF9F2]/60 uppercase mb-2">
              Progress
            </span>

            {/* COMPACT INLINE INPUT */}
            <div className="flex items-center gap-2 text-[#FCF9F2] font-serif text-xl mb-4">
              <input
                type="number"
                value={pageInput}
                // Check if the input is completely empty before converting to a Number
                onChange={(e) => setPageInput(e.target.value === '' ? '' : Number(e.target.value))}
                onFocus={() => setIsLocked(true)} // Drop the anchor
                onBlur={(e) => {
                  // Escape Hatch: If they click away to somewhere OUTSIDE this specific form
                  if (!e.currentTarget.form?.contains(e.relatedTarget as Node)) {
                    setIsLocked(false); // Lift the anchor
                    setPageInput(book.current_page || 0); // Revert their aborted typing to the DB truth
                  }
                }}
                className="w-14 bg-transparent border-b border-[#FCF9F2]/40 text-center font-sans focus:outline-none focus:border-[#FCF9F2] py-0.5 pointer-events-auto"
                min={0}
                // "If we know the exact length of the book, stop them from typing a page number higher than that. But if we don't know the length, just set the ceiling to an 
                // absurdly high number so the input doesn't break."
                max={book.page_count || 9999}
              />
              <span className="opacity-40 font-sans text-sm">/</span>
              <span className="text-sm font-sans text-[#FCF9F2]/80">{total > 0 ? total : '?'}</span>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full h-1 bg-white/20 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[#EFEBE1] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            {/* PRIMARY COMPACT ACTION */}
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-[#FCF9F2] text-[#2C302E] font-sans text-xs font-bold tracking-wider uppercase py-2.5 rounded hover:bg-[#E5E0D8] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-95 transition-all duration-200 shadow-sm pointer-events-auto disabled:opacity-70 disabled:cursor-wait disabled:hover:translate-y-0 disabled:active:scale-100"
            >
              {isUpdating ? "Saving..." : "Update"}
            </button>
          </form>

          {/* BOTTOM ACTIONS CONTAINER */}
          <div className="mt-auto w-full flex flex-col items-center pt-3 border-t border-[#FCF9F2]/10 gap-2">

            {/* SECONDARY DE-PRIORITIZED ACTION */}
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 text-[9px] font-sans font-semibold tracking-widest text-[#FCF9F2] border border-[#FCF9F2]/30 px-4 py-1.5 rounded-full hover:bg-[#FCF9F2] hover:text-[#2C302E] transition-all duration-300 pointer-events-auto"
              onClick={onFinishBook}
              disabled={isFinishing}
            >
              {isFinishing ? "FINISHING..." : "✦ FINISH BOOK"}
            </button>

            {/* TERTIARY ACTION: Shelve For Now */}
            <button
              type="button"
              className="text-[8px] font-sans font-semibold tracking-widest text-[#FCF9F2]/50 hover:text-[#FCF9F2] hover:bg-[#FCF9F2]/10 px-3 py-1 rounded-full transition-all duration-300 pointer-events-auto"
              onClick={onShelveBook}
            >
              SHELVE FOR NOW
            </button>

          </div>

        </div>
      )}

      {/* SLOT 2 UNASSIGN BUTTON (The Hover 'X') */}
      {!isCurrentlyReading && (
        <button
          type="button"
          disabled={isUnassigning}
          onClick={async (e) => {
            e.preventDefault(); // Stop the user from navigating to the book page!
            e.stopPropagation(); // Stop event bubbling

            if (isUnassigning) return; // Prevent double-clicks

            setIsUnassigning(true);

            try {
              const res = await fetch('/api/tracks/unassign', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  track_id: book.track_id, // Passed down via the TrackBook prop
                  slot_id: 2
                })
              });

              if (!res.ok) {
                throw new Error("Failed to unassign book");
              }

              router.refresh(); // The "magic" graceful Next.js refresh that we've used a lot in the codebase now! 
            } catch (err) {
              console.error("Failed to unassign:", err);
              // Only release the lock if it fails so the user can try again. 
              // If it succeeds, the component will unmount anyway when the refresh hits.
              setIsUnassigning(false);
            }
          }}
          className={`absolute top-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 shadow-sm
      ${isUnassigning
              ? "opacity-100 scale-90 bg-[#8C3A3A]/80 cursor-wait text-[#FCF9F2]"
              : "opacity-0 bg-[#2C302E]/60 text-[#FCF9F2] hover:bg-[#8C3A3A] hover:scale-110 group-hover:opacity-100"
            }
    `}
          title="Remove from track"
        >
          {isUnassigning ? (
            // A subtle pulsing dot to respect for labor illusion while we wait for the database
            <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#FCF9F2]" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
};