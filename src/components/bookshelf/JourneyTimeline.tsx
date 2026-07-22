'use client'
// Now a Client Component since it will be interactive!

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type ReadingJourney } from '@/lib/types';

interface JourneyTimelineProps {
  bookshelfItemId: string;
  journeys: ReadingJourney[];
}

export default function JourneyTimeline({ bookshelfItemId, journeys = [] }: JourneyTimelineProps) {
  // New state variables for the interactivity
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startedAt, setStartedAt] = useState('');
  const [finishedAt, setFinishedAt] = useState('');
  const [notes, setNotes] = useState('');

  const router = useRouter();

  // if (!journeys || journeys.length === 0) {
  //   return (
  //     <div className="w-full p-6 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/50 text-sm font-sans text-[#5C613E]/70 flex flex-col items-center justify-center">
  //       <span className="text-2xl opacity-30 mb-2">⏳</span>
  //       <span>No reading history logged yet.</span>
  //     </div>
  //   );
  // } Not needed anymore; we happily accept the case where there are zero record Journeys now to allow for the creation of past joruneys!

  // Helper to format Postgres timestamp strings (e.g., "2026-07-12 14:39:30")
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const d = new Date(dateString.replace(' ', 'T'));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const resetForm = () => {
    setStartedAt('');
    setFinishedAt('');
    setNotes('');
    setIsAdding(false);
  };

  const handleSaveJourney = async () => {
    if (!finishedAt) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: bookshelfItemId,
          started_at: startedAt ? startedAt : null,
          finished_at: finishedAt,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save retroactive journey');

      resetForm();
      router.refresh(); // Magic Refresh: updates the modal with the new journey in place!
    } catch (error) {
      console.error(error);
      alert('Failed to log past journey. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sort journeys by iteration (1st read, 2nd read, etc.)
  const sortedJourneys = [...journeys].sort((a, b) => a.iteration - b.iteration);

  return (
    <div className="flex flex-col gap-6">
      {/* TIMELINE LIST */}
      {sortedJourneys.length > 0 ? (
        <div className="flex flex-col gap-6 relative">
          {/* Vertical spine line */}
          <div className="absolute left-3.75 top-4 bottom-4 w-px bg-[#E5E0D8] z-0" />

          {sortedJourneys.map((journey) => {
            const isFinished = journey.finished_at !== null;
            return (
              <div key={journey.id} className="relative z-10 flex items-start gap-4">
                {/* Node */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 mt-1 shadow-sm transition-colors ${isFinished
                      ? 'bg-[#EFEBE1] border-[#424B2E] text-[#424B2E]'
                      : 'bg-white border-[#5C613E]/50 text-[#5C613E]'
                    }`}
                >
                  <span className="font-sans text-[10px] font-bold">{journey.iteration}</span>
                </div>

                {/* Card */}
                <div className="flex-1 bg-white/60 border border-[#E5E0D8] rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-sans text-xs font-bold tracking-widest uppercase text-[#2C302E]">
                      {isFinished ? 'Completed Read' : 'Active Read'}
                    </h4>
                    <span className={`text-xs font-serif italic ${isFinished ? 'text-[#5C613E]' : 'text-[#424B2E] font-medium'}`}>
                      {journey.started_at ? `${formatDate(journey.started_at)} — ${formatDate(journey.finished_at)}` : `Finished ${formatDate(journey.finished_at)}`}
                    </span>
                  </div>

                  {journey.notes && (
                    <p className="font-serif italic text-sm text-[#5C613E]/90 mt-3 whitespace-pre-wrap">
                      &quot;{journey.notes}&quot;
                    </p>
                  )}

                  {!isFinished && (
                    <p className="font-sans text-xs text-[#5C613E]/80 mt-3">
                      Currently on page {journey.current_page}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full p-6 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/50 text-sm font-sans text-[#5C613E]/70 flex flex-col items-center justify-center">
          <span className="text-2xl opacity-30 mb-2">⌛</span>
          <span>No reading history logged yet.</span>
        </div>
      )}

      {/* ADD RETROACTIVE JOURNEY FORM */}
      {isAdding ? (
        <div className="w-full p-6 border-2 border-[#E5E0D8] rounded-md bg-white shadow-sm flex flex-col gap-4 animate-in fade-in duration-200">
          <h4 className="font-sans text-xs font-bold uppercase tracking-widest text-[#424B2E]">
            Log a Past Reading Journey
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5C613E]">
                Started Date (Optional)
              </label>
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="bg-[#FCF9F2] border border-[#E5E0D8] rounded px-3 py-1.5 font-sans text-xs text-[#2C302E] outline-none focus:border-[#424B2E]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5C613E]">
                Finished Date *
              </label>
              <input
                type="date"
                required
                value={finishedAt}
                onChange={(e) => setFinishedAt(e.target.value)}
                className="bg-[#FCF9F2] border border-[#E5E0D8] rounded px-3 py-1.5 font-sans text-xs text-[#2C302E] outline-none focus:border-[#424B2E]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5C613E]">
              Raw Thoughts (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What lingers in your mind from this specific read-through?"
              className="bg-[#FCF9F2] border border-[#E5E0D8] rounded p-3 font-serif text-sm text-[#2C302E] placeholder:text-[#5C613E]/50 outline-none focus:border-[#424B2E] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#E5E0D8]">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSaving}
              className="text-xs font-sans uppercase tracking-widest text-[#5C613E]/70 hover:text-[#5C613E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveJourney}
              disabled={!finishedAt || isSaving}
              className="px-5 py-2 bg-[#424B2E] text-[#FCF9F2] text-xs font-sans uppercase tracking-widest rounded disabled:opacity-50 hover:bg-[#343b24] transition-colors shadow-sm"
            >
              {isSaving ? 'Saving...' : 'Save Journey'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full min-h-12 p-3 border-2 border-dashed border-[#E5E0D8] hover:border-[#5C613E]/50 hover:bg-white/50 rounded-md text-xs font-sans font-semibold uppercase tracking-wider text-[#5C613E]/80 flex items-center justify-center transition-colors cursor-pointer"
        >
          + Add Past Journey
        </button>
      )}
    </div>
  )
};