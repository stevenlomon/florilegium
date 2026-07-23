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

  // States specifically for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartedAt, setEditStartedAt] = useState('');
  const [editFinishedAt, setEditFinishedAt] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const router = useRouter();

  // if (!journeys || journeys.length === 0) {
  //   return (
  //     <div className="w-full p-6 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/50 text-sm font-sans text-[#5C613E]/70 flex flex-col items-center justify-center">
  //       <span className="text-2xl opacity-30 mb-2">⏳</span>
  //       <span>No reading history logged yet.</span>
  //     </div>
  //   );
  // } Not needed anymore; we happily accept the case where there are zero record Journeys now to allow for the creation of past joruneys!

  // Helper to format Postgres timestamp strings for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const d = new Date(dateString.replace(' ', 'T'));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to format Postgres timestamp strings for the input[type="date"]
  const toDateInputValue = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString.replace(' ', 'T')).toISOString().split('T')[0];
    } catch {
      return dateString.split(' ')[0].split('T')[0];
    }
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

  const startEditing = (journey: ReadingJourney) => {
    setIsAdding(false); // Close add form to prevent visual clutter
    setEditingId(journey.id);
    setConfirmDeleteId(null); // Deletion confirmation state is reset when we start editing
    setEditStartedAt(toDateInputValue(journey.started_at));
    setEditFinishedAt(toDateInputValue(journey.finished_at));
    setEditNotes(journey.notes || '');
  };

  const handleUpdateJourney = async (journeyId: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/journey', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey_id: journeyId,
          started_at: editStartedAt ? editStartedAt : null,
          finished_at: editFinishedAt ? editFinishedAt : null,
          notes: editNotes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update journey');

      setEditingId(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Failed to update journey. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteJourney = async (journeyId: string) => {
    // Tap 1: Ask for confirmation inline
    if (confirmDeleteId !== journeyId) {
      setConfirmDeleteId(journeyId);
      return;
    }

    // Tap 2: Execute!
    setIsDeleting(true);
    try {
      const res = await fetch('/api/journey', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journey_id: journeyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete journey');
      }

      setConfirmDeleteId(null);
      setEditingId(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Failed to delete journey. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort journeys by iteration (1st read, 2nd read, etc.)
  const sortedJourneys = [...journeys].sort((a, b) => a.iteration - b.iteration);

  // Fully vibe coded return render statement
  return (
    <div className="flex flex-col gap-6">
      {/* TIMELINE LIST */}
      {sortedJourneys.length > 0 ? (
        <div className="flex flex-col gap-6 relative">
          <div className="absolute left-3.75 top-4 bottom-4 w-px bg-[#E5E0D8] z-0" />
          {sortedJourneys.map((journey) => {
            const isFinished = journey.finished_at !== null;
            const isEditing = editingId === journey.id;

            return (
              <div key={journey.id} className="relative z-10 flex items-start gap-4 group">
                {/* Node */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 mt-1 shadow-sm transition-colors ${isFinished && !isEditing
                    ? 'bg-[#EFEBE1] border-[#424B2E] text-[#424B2E]'
                    : 'bg-white border-[#5C613E]/50 text-[#5C613E]'
                    }`}
                >
                  <span className="font-sans text-[10px] font-bold">{journey.iteration}</span>
                </div>

                {/* Card */}
                {isEditing ? (
                  <div className="flex-1 bg-white border border-[#E5E0D8] rounded-md p-4 shadow-sm animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5C613E]">
                          Started Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={editStartedAt}
                          onChange={(e) => setEditStartedAt(e.target.value)}
                          className="bg-[#FCF9F2] border border-[#E5E0D8] rounded px-3 py-1.5 font-sans text-xs text-[#2C302E] outline-none focus:border-[#424B2E]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5C613E]">
                          Finished Date
                        </label>
                        <input
                          type="date"
                          value={editFinishedAt}
                          onChange={(e) => setEditFinishedAt(e.target.value)}
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
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="What lingers in your mind from this specific read-through?"
                        className="bg-[#FCF9F2] border border-[#E5E0D8] rounded p-3 font-serif text-sm text-[#2C302E] placeholder:text-[#5C613E]/50 outline-none focus:border-[#424B2E] resize-none"
                      />
                    </div>

                    {/* Unified Action Bar */}
                    <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[#E5E0D8]">
                      {isFinished && (() => {
                        const hasNotes = editNotes.trim().length > 0;
                        const isConfirming = confirmDeleteId === journey.id;

                        return (
                          <div className="flex items-center mr-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteJourney(journey.id)}
                              onMouseLeave={() => setConfirmDeleteId(null)} // Reset if mouse leaves!
                              disabled={isUpdating || isDeleting || hasNotes}
                              title={hasNotes ? "Clear raw thoughts before deleting journey" : undefined}
                              className={`px-3 py-2 text-xs font-sans uppercase tracking-widest rounded transition-all ${hasNotes
                                  ? 'text-[#8C3A3A]/30 cursor-not-allowed'
                                  : isConfirming
                                    ? 'bg-[#8C3A3A] text-white font-semibold'
                                    : 'text-[#8C3A3A]/70 hover:text-[#8C3A3A] hover:bg-[#8C3A3A]/10'
                                } disabled:opacity-50`}
                            >
                              {isDeleting
                                ? 'Deleting...'
                                : isConfirming
                                  ? 'Confirm Delete?'
                                  : 'Delete'}
                            </button>
                            {hasNotes && (
                              <span className="text-[10px] font-serif italic text-[#8C3A3A]/60 ml-1">
                                *Clear thoughts to delete
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setConfirmDeleteId(null);
                        }}
                        disabled={isUpdating || isDeleting}
                        className="px-3 py-2 text-xs font-sans uppercase tracking-widest text-[#5C613E]/70 hover:text-[#5C613E] hover:bg-[#5C613E]/10 rounded transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateJourney(journey.id)}
                        disabled={isUpdating || isDeleting}
                        className="px-5 py-2 bg-[#424B2E] text-[#FCF9F2] text-xs font-sans uppercase tracking-widest rounded disabled:opacity-50 hover:bg-[#343b24] transition-colors shadow-sm"
                      >
                        {isUpdating ? 'Saving...' : 'Save Updates'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-white/60 border border-[#E5E0D8] rounded-md p-4 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-sans text-xs font-bold tracking-widest uppercase text-[#2C302E]">
                        {isFinished ? 'Completed Read' : 'Active Read'}
                      </h4>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => startEditing(journey)}
                          className="text-xs font-sans text-[#5C613E]/50 hover:text-[#424B2E] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Edit
                        </button>
                        <span className={`text-xs font-serif italic ${isFinished ? 'text-[#5C613E]' : 'text-[#424B2E] font-medium'}`}>
                          {journey.started_at ? `${formatDate(journey.started_at)} — ${formatDate(journey.finished_at)}` : `Finished ${formatDate(journey.finished_at)}`}
                        </span>
                      </div>
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
                )}
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