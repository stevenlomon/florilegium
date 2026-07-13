'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type TrackBook } from '@/lib/types';
import ReadingTracksModal from './ReadingTracksModal';
import CelebrationModal from './CelebrationModal';
import ReadingTrackCard from './ReadingTrackCard';

interface ReadingTracksSectionProps {
  initialTracks: TrackBook[];
}

const TRACKS = [
  { id: 'fiction', title: 'Fiction', description: 'Immersive narratives and alternate realities.' },
  { id: 'non-fiction', title: 'Non-fiction', description: 'Expanding models of reality and actionable knowledge.' },
  { id: 'before-bedtime', title: 'Before Bedtime', description: 'Wind-down reading. Low stakes, high comfort.' } // Changed from 'bedtime' to 'before-bedtime' for coherence and ease in db queries
];

// This now takes initialTracks as a prop as the intial data from the server! This client component is now not responsible at all for 
// *fetching* data, only making it come to life and become interactive!
export default function ReadingTracksSection({ initialTracks }: ReadingTracksSectionProps) {
  // In the Horizon Book section, we had a single 5-column row. Now we have a two-dimensional grid; the track and the slot. trackId comes from 
  // TRACKS, "Currently Reading" has slotId 1 and "Follow-up" has slotId 2. It starts as null meaning if it's null, the modal is closed. The 
  // alternative would be three or six separate states which sounds like an absolute nightmare to maintain. A single active modal context allows
  // us to render exactly one ReadingTrackModal at the bottom of the page! activeModalContext it is haha!
  const [trackBooks, setTrackBooks] = useState(initialTracks); // No longer starts as an empty array; it starts as what the server has fetched and provided!
  const [activeModalContext, setActiveModalContext] = useState<{ trackId: string, slotId: number, trackTitle: string } | null>(null); // Updated to include the title cased track title to make it easier in the modal

  // New Celebration state variables
  const [isFinishingId, setIsFinishingId] = useState<string | null>(null);
  const [celebrationPayload, setCelebrationPayload] = useState<{ bookTitle: string, promotion: any } | null>(null);
  const router = useRouter(); // For router.refresh()

  // No more fetchReadingTracks!
  // When router.refresh() happens, the server sends down new props. This effect catches them and updates the UI instantly.
  // This useEffect is essentially the core of the entire Full Stack machinery: 
  // Server loads initial data -> Client holds said data in Browser memory (useState) -> user interacts and triggers a background
  // mutation -> router.refresh() asks the server for the data; the new single source of truth -> this useEffect patches this new 
  // data into the client state without a full page reload
  useEffect(() => {
    setTrackBooks(initialTracks);
  }, [initialTracks]);

  // And this is our new refresh function! No more fetch('/api/tracks') needed!
  const refreshReadingTracks = () => {
    console.log("Asking server for fresh data...");
    router.refresh(); 
  };
  // The rest of the file stays exactly the same! Completely untouched.
  // It's... it's all so simple yet incredibly elegant. And it just makes intuitive sense! I can never go back from using Next.js now haha!

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
    refreshReadingTracks(); // Needed to refresh the UI client-side! (useState)
    router.refresh();       // This refreshes the UI server-side (the entire Server Component(s))
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
                // Now has a fully dedicated client component for the Reading Track card with the new current_page input feature 
                // being implemented. We make this into its own dedicated component but *not* the Assignment button in Scenario B.
                // Yes, we *could* make that its own component and even try to make it so that it could live both here and in the
                // Horizon section. But.. just because you *can* do something doesn't mean that you *should* and that it serves
                // you to. 
                // Here it doesn't serve us; the need isn't there and it would slow down MVP momentum. *Just in time, not just in case*
                const isCurrentlyReading = slot === 1;

                return (
                  <div key={`${track.id}-${slot}`} className="flex flex-col gap-3 relative">
                    
                    {/* The new, self-contained component. `e` is type inferred as `MouseEvent<Element, MouseEvent>`! */}
                    <ReadingTrackCard 
                      book={assignedBook} 
                      isCurrentlyReading={isCurrentlyReading} 
                      onFinishBook={(e) => handleFinishBook(e, assignedBook.bookshelf_item_id, assignedBook.title)}
                      isFinishing={isFinishingId === assignedBook.bookshelf_item_id}
                    />

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