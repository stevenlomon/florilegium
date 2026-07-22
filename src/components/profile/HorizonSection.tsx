'use client'
import { useState } from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type BookshelfItem } from '@/lib/types'
import HorizonModal from './HorizonModal';

interface HorizonSectionProps {
  initialBooks: BookshelfItem[];
}

// The only user interactive section (for now) on the Profile page. Now receives initial data from its server component parent
// Here we'll implement the modal that pops up when adding a Horizon book which will require useState
export default function HorizonSection({ initialBooks }: HorizonSectionProps) {
  const horizonBooks = initialBooks; // Simply grabs initialBooks now from the server. And doesn't need to be a state variable! Same reason as trackBooks in ReadingTracksSection
  const [activeSlot, setActiveSlot] = useState<number | null>(null); // Instead of `const [isModalOpen, setIsModalOpen] = useState(false);`, we track the specific slot clicked (1-5). If it's null, the modal is closed

  // NEW: State for the Two-Tap Unassignment
  const [confirmingSlot, setConfirmingSlot] = useState<number | null>(null);
  const [unassigningSlot, setUnassigningSlot] = useState<number | null>(null);

  const router = useRouter();

  // When router.refresh() happens, the server sends down new fresh props with new fresh data. And once again; this effect catches them and patches the UI instantly
  // useEffect(() => {
  //   setHorizonBooks(initialBooks);
  // }, [initialBooks]); Since horizonBooks is no longer a state variable

  // And the new clean refresh function. No more client-side fetch required
  const refreshHorizon = () => {
    console.log("Asking server for fresh Horizon data...");
    router.refresh();
  }

  const handleUnassign = async (e: React.MouseEvent, bookshelfItemId: string, slot: number) => {
    e.preventDefault(); // Stop the Link from navigating!
    e.stopPropagation();

    // Tap 1: Ask for confirmation
    if (confirmingSlot !== slot) {
      setConfirmingSlot(slot);
      return;
    }

    // Tap 2: Execute!
    setUnassigningSlot(slot);
    try {
      const res = await fetch('/api/bookshelf/horizon', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: bookshelfItemId,
          horizon_slot: null // Passing null clears the slot in the DB
        })
      });

      if (!res.ok) throw new Error("Failed to unassign Horizon book");

      refreshHorizon();
    } catch (error) {
      console.error(error);
      alert("Failed to remove book. Please try again.");
    } finally {
      setUnassigningSlot(null);
      setConfirmingSlot(null);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-normal text-[#2C302E]">
          The Horizon
        </h2>
        <p className="text-[#5C613E] mt-1 font-serif">
          The dense masterpieces that we&apos;re building momentum towards. Capped strictly at five to ensure intent over accumulation.
        </p>
      </div>

      {/* Grid layout for the 5 slots. 
          On mobile: 2 columns. On tablet: 3 columns. On large screens: 5 columns.
        */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">

        {[1, 2, 3, 4, 5].map((slot) => {
          // Not 5 purely visual empty slots anymore; now we need actually some logic haha!
          // Check if any book in our state is assigned to this specific slot
          const assignedBook = horizonBooks.find(book => book.horizon_slot === slot);

          if (assignedBook) {
            // SCENARIO A: THE SLOT IS FILLED (Letterboxd Style)
            return (
              <Link
                key={slot}
                href={`/book/${assignedBook.external_id}`} // No longer `href={`/book/${assignedBook.external_id || assignedBook.book_id}`}`, we can confidently remove the fallback that crashes the app anyway
                className="group relative block aspect-2/3 rounded-md overflow-hidden border border-[#E5E0D8] hover:border-[#5C613E] hover:shadow-md transition-all shadow-sm w-full bg-[#FCF9F2]"
              >

                {/* NEW: The Two-Tap Unassign Button */}
                <button
                  type="button"
                  disabled={unassigningSlot === slot}
                  onClick={(e) => handleUnassign(e, assignedBook.bookshelf_item_id, slot)}
                  onMouseLeave={() => setConfirmingSlot(null)} // Cancel confirmation if mouse leaves
                  className={`absolute top-2 right-2 z-20 flex h-7 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 shadow-sm
                    ${unassigningSlot === slot
                      ? "w-7 opacity-100 scale-90 bg-[#8C3A3A]/80 cursor-wait text-[#FCF9F2]"
                      : confirmingSlot === slot
                        ? "w-auto px-3 opacity-100 bg-[#8C3A3A] hover:bg-[#6b2b2b] text-[#FCF9F2]"
                        : "w-7 opacity-0 bg-[#2C302E]/60 text-[#FCF9F2] hover:bg-[#8C3A3A] group-hover:opacity-100"
                    }
                  `}
                  title="Remove from Horizon"
                >
                  {unassigningSlot === slot ? (
                    <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#FCF9F2]" />
                  ) : confirmingSlot === slot ? (
                    <span className="text-[10px] font-sans font-bold tracking-widest uppercase">Remove?</span>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>

                {/* Cover Image (Unchanged) */}
                {assignedBook.cover_image_url ? (
                  <Image
                    src={assignedBook.cover_image_url}
                    alt={`Cover of ${assignedBook.title}`}
                    fill // This replaces width/height and forces the image to perfectly fill the aspect-2/3 container
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    priority={true}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" // A very subtle, premium zoom effect on hover
                  />
                ) : (
                  // The elegant fallback for books with no cover (like "My book!")
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#EFEBE1]/50 border-4 border-transparent group-hover:border-white/20 transition-all">
                    <h3 className="font-heading text-lg text-[#2C302E] leading-tight line-clamp-3 mb-2">
                      {assignedBook.title}
                    </h3>
                    <p className="font-sans text-xs text-[#5C613E] line-clamp-2">
                      {assignedBook.author}
                    </p>
                  </div>
                )}
              </Link>
            );
          }

          // SCENARIO B: THE SLOT IS EMPTY (The original UI)
          return (
            <button // Changed from <div> to <button> for semantic HTML and accessibility
              key={slot}
              type='button' // So it doesn't accidentally trigger forms
              className="group relative flex flex-col items-center justify-center aspect-2/3 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/30 hover:bg-[#EFEBE1]/50 hover:border-[#5C613E]/40 transition-all cursor-pointer w-full" // Added w-full to ensure the button perfectly fills the grid column space
              onClick={() => setActiveSlot(slot)} // onClick intentionally put here for better UX! Don't force the user to specifically click the "+"! Apparently this is in line with what is called Fitt's Law in UX haha! Never heard of it but it makes perfect intuitive sense
            >
              {/* The Plus Button */}
              <div className="w-10 h-10 flex items-center justify-center border border-[#E5E0D8] rounded bg-white text-[#5C613E] group-hover:text-[#2C302E] group-hover:border-[#5C613E] transition-colors mb-4 shadow-sm">
                <span className="text-xl font-light">+</span>
              </div>

              {/* The Labels */}
              <p className="text-xs font-serif text-[#5C613E]/70 italic mb-1 text-center px-2">
                Awaiting a masterpiece
              </p>
              <p className="text-[10px] font-sans font-semibold tracking-widest text-[#5C613E] uppercase mt-2">
                Slot {slot}
              </p>
            </button>
          );
        })}

      </div>

      { /* The new Horizon Modal! */}
      <HorizonModal
        isOpen={activeSlot !== null} // Only open if activeSlot is a number between 1-5
        onClose={() => setActiveSlot(null)}
        targetSlot={activeSlot}
        onSuccess={refreshHorizon}
      />
    </section>
  )
};