'use client'

import { useState } from 'react';

interface PromotionData {
  promotedBook: string | null;
  trackName: string;
  finishedJourneyId: string
}

interface CelebrationModalProps {
  bookTitle: string;
  promotion: PromotionData;
  onClose: () => void;
}

export default function CelebrationModal({ bookTitle, promotion, onClose }: CelebrationModalProps) {
  const [rawThoughts, setRawThoughts] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    const res = await fetch('/api/log-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reading_journey_id: promotion.finishedJourneyId,
        notes: rawThoughts
      })
    });

    setTimeout(() => {
      setIsSaving(false);
      onClose(); // This will trigger the router.refresh() in the parent!
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#FCF9F2] rounded-lg shadow-2xl flex flex-col p-10 relative animate-in zoom-in-95 duration-300 border border-[#E5E0D8]">

        {/* 1. THE CELEBRATION HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#424B2E] text-[#FCF9F2] mb-6 shadow-sm">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="font-heading text-4xl text-[#2C302E] leading-tight mb-3">
            You finished {bookTitle}!
          </h2>

          {/* Dynamic Promotion Message */}
          {promotion.promotedBook ? (
            <p className="font-serif text-lg text-[#5C613E]">
              <strong className="font-semibold text-[#424B2E]">{promotion.promotedBook}</strong> has automatically been moved to Currently Reading in your <strong className="font-semibold text-[#424B2E]">{promotion.trackName}</strong> track.
            </p>
          ) : (
            <p className="font-serif text-lg text-[#5C613E]">
              Your <strong className="font-semibold text-[#424B2E]">{promotion.trackName}</strong> track is now empty.
            </p>
          )}
        </div>

        {/* 2. THE RAW THOUGHTS CAPTURE */}
        <div className="w-full flex-1 flex flex-col">
          <label className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-3 ml-1">
            Capture Raw Thoughts (Optional)
          </label>
          <textarea
            value={rawThoughts}
            onChange={(e) => setRawThoughts(e.target.value)}
            placeholder={`You just turned the last page. What's lingering in your mind right now?\n\nThis will be a log post completely separate from your polished review of the book\n\nDon't overthink it—just write`}
            className="w-full min-h-37.5 p-5 border border-[#E5E0D8] rounded-md bg-white text-sm font-serif text-[#2C302E] placeholder:text-[#5C613E]/50 focus:outline-none focus:border-[#424B2E] focus:ring-1 focus:ring-[#424B2E] resize-none shadow-sm transition-all"
          />

          {/* 3. THE ACTION BUTTONS */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E5E0D8]">
            <button
              onClick={onClose}
              className="text-[#5C613E] font-sans text-sm font-medium hover:text-[#2C302E] transition-colors"
            >
              Skip for now
            </button>

            {/* "Assign Follow-up" button removed for better UX! For three main reasons:
              * Let the user sit in the moment of just having finishing a book! Let the moment linger! Don't reinforce a culture that is obsessed
                with always rushing to the next thing. The user writes their raw thoughts, no matter how short or long, closes the modal, and then
                chooses a Follow-up book in their own pace on their own terms
              * We already have super neat empty slots UI!! Use them!!
              * A clean user-friendly modal should be binary in its options. Showing the user a third button causes more frustration and confusion
                than joy and convenience and we don't want that. "Will clicking this button save my raw thoughts?" Nah, fuck that
            */}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-8 py-2.5 rounded hover:bg-[#343b24] transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save & Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}