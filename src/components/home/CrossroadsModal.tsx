'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface CrossroadsModalProps {
  bookTitle: string;
  trackId: number;
  isHorizonBook: boolean;
  onClose: () => void;
}

export default function CrossroadsModal({ bookTitle, trackId, isHorizonBook, onClose }: CrossroadsModalProps) {
  const [isShelving, setIsShelving] = useState<number | null>(null);
  const [steppingAwayNotes, setSteppingAwayNotes] = useState('');

  // Our new useEscapeKey custom hook! This is a conditionally rendered modal that doesn't use isOpen, we only render them
  // when they're active. Our hook is smart enough to default to true when mounted!
  useEscapeKey(onClose);

  const router = useRouter();

  const handleUnassign = async (targetStatusId: number) => {
    setIsShelving(targetStatusId);

    try {
      const res = await fetch('/api/tracks/unassign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: trackId,
          slot_id: 1,
          target_status_id: targetStatusId,
          ...(steppingAwayNotes.trim() && { stepping_away_notes: steppingAwayNotes.trim() })
        })
      });

      if (!res.ok) throw new Error("Failed to shelve book");

      // Honor the Slow Web: Ensure the micro-narrative of shelving has a slight delay
      setTimeout(() => {
        setIsShelving(null);
        onClose(); // Close the modal
        router.refresh(); // Tell the server to empty the slot on the UI
      }, 350); // Properly fine tuned to feel *just right* haha

    } catch (err) {
      console.error(err);
      alert("Failed to step away from the book. Please try again.");
      setIsShelving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#FCF9F2] rounded-lg shadow-2xl flex flex-col p-8 relative animate-in zoom-in-95 duration-300 border border-[#E5E0D8]">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          disabled={isShelving !== null}
          className="absolute top-6 right-6 text-[#5C613E] hover:text-[#2C302E] transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8 mt-4">
          {isHorizonBook && (
            <p className="text-[#424B2E] font-serif text-xs font-bold uppercase tracking-widest mb-4">
              ✦ Horizon Book ✦
            </p>
          )}
          <h2 className="font-heading text-3xl text-[#2C302E] leading-tight mb-2">
            Stepping away?
          </h2>
          <p className="font-serif text-[#5C613E] leading-relaxed px-2">
            {isHorizonBook ? (
              <>
                You are stepping away from <strong className="font-semibold text-[#424B2E]">{bookTitle}</strong>, but this is not a failure.
                <br /><br />
                It takes real discernment to know when a work of this magnitude belongs to a different season of your life. Has your focus simply shifted, or is this volume waiting for a quieter state of mind?
              </>
            ) : (
              <>
                You are removing <strong className="font-semibold text-[#424B2E]">{bookTitle}</strong> from your active tracking.
              </>
            )}
          </p>
        </div>

        <div className="mb-6">
          <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5C613E] block mb-2">
            Stepping Away Note (Optional)
          </label>
          <textarea
            rows={7}
            value={steppingAwayNotes}
            onChange={(e) => setSteppingAwayNotes(e.target.value)}
            disabled={isShelving !== null}
            placeholder={"Reading is never an obligation.\n\nIs this book simply waiting for a different season of life, or is it not the right fit?\n\nCapture what's on your mind—there is no wrong reason to step away."}
            className="w-full bg-white border border-[#E5E0D8] rounded-md p-3 font-serif text-sm text-[#2C302E] placeholder:text-[#5C613E]/40 outline-none focus:border-[#424B2E] resize-none disabled:opacity-50"
          />
        </div>

        <p className="font-serif text-[#5C613E] text-center mb-4">
          Where should we put it?
        </p>

        <div className="flex flex-col gap-4 w-full">
          {/* Option A: Intend to Read */}
          <button
            onClick={() => handleUnassign(1)}
            disabled={isShelving !== null}
            className={`flex flex-col items-center justify-center p-4 rounded-md border-2 transition-all duration-300
              ${isShelving === 1 
                ? 'bg-[#EFEBE1] border-[#424B2E]/50 cursor-wait' 
                : 'bg-white border-[#E5E0D8] hover:border-[#424B2E]/50 hover:bg-[#EFEBE1]/50'
              } disabled:opacity-70`}
          >
            <span className="font-sans text-sm font-bold tracking-widest text-[#424B2E] uppercase mb-1">
              {isShelving === 1 ? "Shelving..." : "Back on the Shelf"}
            </span>
            <span className="font-serif text-xs text-[#5C613E] italic">
              Return to &quot;Intend to Read&quot; for later
            </span>
          </button>

          {/* Option B: Dropped */}
          <button
            onClick={() => handleUnassign(4)}
            disabled={isShelving !== null}
            className={`flex flex-col items-center justify-center p-4 rounded-md border-2 transition-all duration-300
              ${isShelving === 4 
                ? 'bg-[#EFEBE1] border-[#8C3A3A]/50 cursor-wait' 
                : 'bg-white border-[#E5E0D8] hover:border-[#8C3A3A]/40 hover:bg-[#8C3A3A]/5'
              } disabled:opacity-70`}
          >
            <span className="font-sans text-sm font-bold tracking-widest text-[#8C3A3A] uppercase mb-1">
              {isShelving === 4 ? "Marking..." : "Mark as Dropped"}
            </span>
            <span className="font-serif text-xs text-[#5C613E] italic">
              Close the journey entirely
            </span>
          </button>
        </div>

      </div>
    </div>
  )
};