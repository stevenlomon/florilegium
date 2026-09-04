'use client'

import { useState } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface PromotionData {
  upNextBookTitle: string | null;
  trackName: string;
  finishedJourneyId: string
}

interface CelebrationModalProps {
  bookTitle: string;
  isHorizonBook: boolean; // For the special Horizon celebration message!
  promotion: PromotionData;
  onClose: () => void;
}

export default function CelebrationModal({ bookTitle, isHorizonBook, promotion, onClose }: CelebrationModalProps) {
  const [rawThoughts, setRawThoughts] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Our new useEscapeKey custom hook! This is a conditionally rendered modal that doesn't use isOpen, we only render them
  // when they're active. Our hook is smart enough to default to true when mounted!
  useEscapeKey(onClose);

  const handleSave = async () => {
    setIsSaving(true);

    await fetch('/api/log-posts', {
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
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#FCF9F2] rounded-lg shadow-2xl flex flex-col p-6 md:p-10 relative animate-in zoom-in-95 duration-300 border border-[#E5E0D8]">

        {/* 1. THE CELEBRATION HEADER */}
        <div className="text-center mb-6 md:mb-10">
          {isHorizonBook ? (
            <>
              <p className="text-[#424B2E] font-serif text-xs font-bold uppercase tracking-widest mb-4 md:mb-6">
                ✦ Horizon Book ✦
              </p>
              <h2 className="font-heading text-3xl md:text-4xl text-[#2C302E] leading-tight mb-3">
                A summit reached.
              </h2>
              <p className="font-serif text-base md:text-lg text-[#5C613E] mb-4">
                You have finished <strong className="font-semibold text-[#424B2E]">{bookTitle}</strong>.
              </p>
              <p className="font-serif text-base md:text-lg text-[#5C613E] mb-4">
                Completing a work from your Horizon is no small feat&mdash;it is a quiet triumph of sustained attention and deep devotion to the page.
              </p>
              <p className="font-serif text-base md:text-lg text-[#5C613E] mb-4">
                You set this masterpiece apart, climbed its dense terrain, and saw it through to the very last line.
              </p>
              <p className="font-serif text-base md:text-lg text-[#5C613E]">
                A monumental book leaves an indelible mark on how you think and see. Resist the urge to rush to the next book; step away, breathe deeply, and give yourself permission to linger in the quiet space you&apos;ve earned.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#424B2E] text-[#FCF9F2] mb-4 md:mb-6 shadow-sm">
                <span className="text-3xl">✨</span>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl text-[#2C302E] leading-tight mb-3">
                You finished {bookTitle}!
              </h2>

              {/* Dynamic Promotion Message: updated to integrate Ma (間) whether the Up Next slot is filled or not, now without explicitly mentioning it */}
              {promotion.upNextBookTitle ? (
                <>
                  <p className="font-serif text-base md:text-lg text-[#5C613E]">
                    <strong className="font-semibold text-[#424B2E]">{promotion.upNextBookTitle}</strong> is resting in Up Next for your <strong className="font-semibold text-[#424B2E]">{promotion.trackName}</strong> track.
                  </p>
                  <p className="font-serif text-base md:text-lg text-[#5C613E]">
                    Whenever your heart feels is the right time, it&apos;s there to begin.
                  </p>
                  <p className="font-serif text-base md:text-lg text-[#5C613E] mt-4">
                    For now, this is an invitation to take a few moments to simply exist in this intentional space in between.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-serif text-base md:text-lg text-[#5C613E]">
                    Your <strong className="font-semibold text-[#424B2E]">{promotion.trackName}</strong> track is now open for your next great undertaking.
                  </p>
                  <p className="font-serif text-base md:text-lg text-[#5C613E] mt-4">
                    For now, this is an invitation to take a few moments to simply exist in this intentional space in between.
                  </p>
                </>
              )}
            </>
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
            placeholder={isHorizonBook
              ? `The final page is turned, and the weight of the book is still in your hands.\n\nWhat is echoing in your thoughts right now?\n\nCapture the unpolished residue before it fades—or simply close the volume and sit in the quiet.`
              : `You just turned the last page. What's lingering in your mind right now?\n\nThis will be a log post completely separate from your polished review of the book\n\nDon't overthink it—just write`}
            className="w-full min-h-24 md:min-h-37.5 p-4 md:p-5 border border-[#E5E0D8] rounded-md bg-white text-sm font-serif text-[#2C302E] placeholder:text-[#5C613E]/50 focus:outline-none focus:border-[#424B2E] focus:ring-1 focus:ring-[#424B2E] resize-none shadow-sm transition-all"
          />

          {/* 3. THE ACTION BUTTONS */}
          <div className="flex items-center justify-between mt-5 pt-4 md:mt-8 md:pt-6 border-t border-[#E5E0D8]">
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
  )
};