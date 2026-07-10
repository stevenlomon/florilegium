'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ReadingTracksModal from './ReadingTracksModal';
import CelebrationModal from './CelebrationModal';

export interface TrackBook {
  track_id: string;
  slot_id: number;
  book_id: string;
  bookshelf_item_id: string; // Needed for the onHover enlarging and the Celebration modal
  external_id: string | null;
  title: string;
  author: string;
  cover_image_url: string | null;
}

const TRACKS = [
  { id: 'fiction', title: 'Fiction', description: 'Immersive narratives and alternate realities.' },
  { id: 'non-fiction', title: 'Non-fiction', description: 'Expanding models of reality and actionable knowledge.' },
  { id: 'before-bedtime', title: 'Before Bedtime', description: 'Wind-down reading. Low stakes, high comfort.' } // Changed from 'bedtime' to 'before-bedtime' for coherence and ease in db queries
];

export default function ReadingTracksSection() {
  // In the Horizon Book section, we had a single 5-column row. Now we have a two-dimensional grid; the track and the slot. trackId comes from 
  // TRACKS, "Currently Reading" has slotId 1 and "Follow-up" has slotId 2. It starts as null meaning if it's null, the modal is closed. The 
  // alternative would be three or six separate states which sounds like an absolute nightmare to maintain. A single active modal context allows
  // us to render exactly one ReadingTrackModal at the bottom of the page! activeModalContext it is haha!
  const [activeModalContext, setActiveModalContext] = useState<{ trackId: string, slotId: number, trackTitle: string } | null>(null); // Updated to include the title cased track title to make it easier in the modal
  const [trackBooks, setTrackBooks] = useState<TrackBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Celebration state variables
  const [isFinishingId, setIsFinishingId] = useState<string | null>(null);
  const [celebrationPayload, setCelebrationPayload] = useState<{ bookTitle: string, promotion: any } | null>(null);
  const router = useRouter(); // For router.refresh()

  const fetchReadingTracks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tracks');
      if (res.ok) {
        const data = await res.json();
        setTrackBooks(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching reading tracks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReadingTracks();
  }, []);

  const refreshReadingTracks = () => {
    console.log("Refreshing Reading Tracks UI...");
    fetchReadingTracks();
  };

  const handleFinishBook = async (e: React.MouseEvent, bookshelfItemId: string, bookTitle: string) => {
    e.preventDefault();
    e.stopPropagation(); // Completely new to me, first time seeing! It's used here to prevent Event Bubbling and any unwanted side effects from the click. The click is contained strictly to the "Finish" button so that we can be in control when we show the modal

    if (isFinishingId) return; // To prevent double clicks
    setIsFinishingId(bookshelfItemId);

    try {
      const res = await fetch('/api/bookshelf', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: bookshelfItemId,
          status_id: 3 // 3 = "Read" which will trigger the Librarian Transaction!
        })
      });

      if (!res.ok) throw new Error("Failed to finish book");

      const data = await res.json();

      if (data.promotion) {
        // Intercept the payload!! In order to show our new modal
        setCelebrationPayload({ bookTitle, promotion: data.promotion }); // Now includes the finishedJourneyId we've added
      } else {
        // Fallback just in case
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to finish book. Please try again.");
    } finally {
      setIsFinishingId(null);
    }
  };

  const handleCloseCelebration = () => {
    setCelebrationPayload(null);
    router.refresh(); // Refresh the grid to show the newly promoted book!
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-[#E5E0D8] -mx-4 xl:mx-0">
      {TRACKS.map((track) => (
        <section key={track.id} className="py-8 xl:py-0 px-4 xl:px-8 first:xl:pl-0 last:xl:pr-0 flex flex-col">

          {/* Track Header */}
          <div className="mb-8 min-h-20">
            <h2 className="text-2xl font-heading text-[#2C302E]">{track.title}</h2>
            <p className="text-[#5C613E] font-serif italic text-sm mt-1 leading-snug">{track.description}</p>
          </div>

          {/* Track Grid: Exactly 2 slots (Currently Reading + Up Next) */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            {[1, 2].map((slot) => {
              const assignedBook = trackBooks.find(b => b.track_id === track.id && b.slot_id === slot);
              const slotLabel = slot === 1 ? "Currently Reading" : "Up Next";

              if (assignedBook) {
                // SCENARIO A: THE SLOT IS FILLED
                const isCurrentlyReading = slot === 1;

                return (
                  <div key={`${track.id}-${slot}`} className="flex flex-col gap-3 relative">
                    <div className={`group relative block aspect-2/3 rounded-md border border-[#E5E0D8] bg-[#FCF9F2] shadow-sm ${isCurrentlyReading
                      ? 'cursor-default origin-bottom transition-all duration-300 hover:scale-112 hover:z-50 hover:shadow-2xl'
                      : 'hover:border-[#5C613E] hover:shadow-md transition-all'
                      }`}>

                      {/* COVER IMAGE */}
                      <Link href={`/book/${assignedBook.external_id || assignedBook.book_id}`} className="absolute inset-0 overflow-hidden rounded-md">
                        {assignedBook.cover_image_url ? (
                          <Image
                            src={assignedBook.cover_image_url}
                            alt={`Cover of ${assignedBook.title}`}
                            fill
                            sizes="(max-width: 768px) 50vw, 15vw"
                            priority={true}
                            className={`object-cover w-full h-full transition-transform duration-500 ${!isCurrentlyReading && 'group-hover:scale-105'}`}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#EFEBE1]/50 border-4 border-transparent group-hover:border-white/20 transition-all">
                            <h3 className="font-heading text-base text-[#2C302E] leading-tight line-clamp-3 mb-2">{assignedBook.title}</h3>
                            <p className="font-sans text-[10px] text-[#5C613E] line-clamp-2">{assignedBook.author}</p>
                          </div>
                        )}
                      </Link>

                      {/* THE NEW HOVER OVERLAY (ONLY FOR SLOT 1) */}
                      {isCurrentlyReading && (
                        <div className="absolute inset-0 bg-[#2C302E]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 rounded-md pointer-events-none">

                          {/* Progress Tracker (Placeholder with hardcoded pages for now) */}
                          <div className="mb-5 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 w-full">
                            <span className="text-[#FCF9F2] font-sans text-[10px] uppercase tracking-widest font-medium">Page 180 / 320</span>
                            <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-[#EFEBE1] w-[56%] rounded-full"></div>
                            </div>
                          </div>

                          {/* Finish Button */}
                          <button
                            onClick={(e) => handleFinishBook(e, assignedBook.bookshelf_item_id, assignedBook.title)}
                            disabled={isFinishingId === assignedBook.bookshelf_item_id}
                            className={`pointer-events-auto bg-[#EFEBE1] text-[#2C302E] px-4 py-2.5 rounded text-xs w-full font-sans font-bold uppercase tracking-wider shadow-sm transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75 ${isFinishingId === assignedBook.bookshelf_item_id
                              ? 'opacity-70 cursor-wait'
                              : 'hover:bg-white hover:scale-105'
                              }`}
                          >
                            {isFinishingId === assignedBook.bookshelf_item_id ? 'Finishing...' : 'Finish Book'}
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-[9px] font-sans font-bold tracking-widest text-[#5C613E] uppercase text-center relative z-10">
                      {slotLabel}
                    </p>
                  </div>
                );
              }

              // SCENARIO B: THE SLOT IS EMPTY
              return (
                <button
                  key={`${track.id}-${slot}`}
                  type='button'
                  className="group relative flex flex-col items-center justify-center aspect-2/3 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/30 hover:bg-[#EFEBE1]/50 hover:border-[#5C613E]/40 transition-all cursor-pointer w-full"
                  onClick={() => setActiveModalContext({ trackId: track.id, slotId: slot, trackTitle: track.title })}
                >
                  <div className="w-8 h-8 flex items-center justify-center border border-[#E5E0D8] rounded bg-white text-[#5C613E] group-hover:text-[#2C302E] group-hover:border-[#5C613E] transition-colors mb-3 shadow-sm">
                    <span className="text-lg font-light">+</span>
                  </div>
                  <p className="text-[11px] font-serif text-[#5C613E]/70 italic mb-1 text-center px-1">
                    Assign book
                  </p>
                  <p className="text-[9px] font-sans font-semibold tracking-widest text-[#5C613E] uppercase mt-2">
                    {slotLabel}
                  </p>
                </button>
              );
            })}
          </div>

          { /* The new Reading Track Modal */}
          <ReadingTracksModal
            isOpen={activeModalContext !== null} // Only open if activeModalContext is a valid object
            onClose={() => setActiveModalContext(null)}
            targetSlot={activeModalContext}
            onSuccess={refreshReadingTracks}
          />

          { /* The new Celebration Modal! */}
          {celebrationPayload && (
            <CelebrationModal
              bookTitle={celebrationPayload.bookTitle}
              promotion={celebrationPayload.promotion}
              onClose={handleCloseCelebration}
            />
          )}

        </section>
      ))}
    </div>
  );
}