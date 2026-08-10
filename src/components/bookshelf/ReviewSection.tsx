'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReviewSectionProps {
  bookshelfItemId: string;
  initialReview: string | null;
}

export default function ReviewSection({ bookshelfItemId, initialReview }: ReviewSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [reviewText, setReviewText] = useState(initialReview || '');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/bookshelf', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: bookshelfItemId,
          review: reviewText
        })
      });

      if (!res.ok) throw new Error('Failed to save review');

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to save review. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setReviewText(initialReview || ''); // Revert to original text
    setIsEditing(false);
  };

  return (
    <section>
      <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-3">
        Your Review
      </h3>

      {isEditing ? (
        <div className="w-full p-4 border-2 border-[#E5E0D8] rounded-md bg-white shadow-sm flex flex-col gap-4 animate-in fade-in duration-200">
          <textarea
            autoFocus
            placeholder="Write your polished review, summary, or takeaways here..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full min-h-30 bg-transparent outline-none font-serif text-sm text-[#2C302E] placeholder:text-[#5C613E]/50 resize-y"
          />
          <div className="flex justify-end gap-3 mt-2 border-t border-[#E5E0D8] pt-3">
            <button
              onClick={handleCancel}
              className="text-xs font-sans uppercase tracking-widest text-[#5C613E]/70 hover:text-[#5C613E] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-[#424B2E] text-[#FCF9F2] text-xs font-sans uppercase tracking-widest rounded disabled:opacity-50 hover:bg-[#343b24] transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      ) : initialReview ? (
        <div className="w-full p-6 border-2 border-[#E5E0D8] rounded-md bg-white/50 group relative">
          <p className="font-serif text-[#2C302E] text-sm leading-relaxed whitespace-pre-wrap">
            {initialReview}
          </p>
          {/* Hover Edit button to match Recommendation Context UX */}
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 text-xs font-sans text-[#5C613E]/50 hover:text-[#424B2E] opacity-0 group-hover:opacity-100 transition-opacity bg-[#FCF9F2] px-3 py-1 rounded-full border border-[#E5E0D8]"
          >
            Edit
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full min-h-30 p-4 border-2 border-dashed border-[#E5E0D8] hover:border-[#5C613E]/50 hover:bg-white/50 rounded-md text-sm font-serif italic text-[#5C613E]/70 flex items-center justify-center transition-colors cursor-pointer"
        >
          + Add a polished review or summary
        </button>
      )}
    </section>
  );
}