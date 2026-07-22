'use client';

import { useState } from 'react';
import { type Recommendation } from '@/lib/types';

interface RecommendationContextSectionProps {
  bookshelfItemId: string;
  existingRecs?: Recommendation[];
}

export default function RecommendationContextSection({ bookshelfItemId, existingRecs = [] }: RecommendationContextSectionProps) {
  const [recs, setRecs] = useState<Recommendation[]>(existingRecs);

  // Form State for adding a new entry
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recommendedBy, setRecommendedBy] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  // State for editing an existing entry
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRecommendedBy, setEditRecommendedBy] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const resetForm = () => {
    setRecommendedBy('');
    setLink('');
    setNotes('');
    setIsAdding(false);
  };

  const handleSaveNew = async () => {
    if (recommendedBy.trim().length < 3) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/recs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: bookshelfItemId,
          recommended_by: recommendedBy,
          link: link.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save recommendation context');

      const { data } = await response.json();

      // Append the newly created row to our list!
      setRecs(prev => [...prev, data]);
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (rec: Recommendation) => {
    setIsAdding(false); // Close add form if it's open to prevent double-forms
    setEditingId(rec.id);
    setEditRecommendedBy(rec.recommended_by);
    setEditLink(rec.link || '');
    setEditNotes(rec.notes || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string) => {
    if (editRecommendedBy.trim().length < 3) return;

    setIsUpdating(true);

    try {
      const response = await fetch('/api/recs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          recommended_by: editRecommendedBy,
          link: editLink.trim() || null,
          notes: editNotes.trim() || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update recommendation context');

      const { data } = await response.json();

      // Update the specific record in our list
      setRecs(prev => prev.map(r => r.id === id ? data : r));
      setEditingId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E]">
        Recommendation Context
      </h3>

      {/* The Stack of Saved Recommendations */}
      {recs.map((rec) => (
        editingId === rec.id ? (
          // EDIT MODE FORM
          <div key={rec.id} className="w-full p-4 border-2 border-[#E5E0D8] rounded-md bg-white shadow-sm flex flex-col gap-4 animate-in fade-in duration-200">
            <input
              type="text"
              placeholder="Who recommended this book to you? (Min 3 chars) *"
              value={editRecommendedBy}
              onChange={(e) => setEditRecommendedBy(e.target.value)}
              className="w-full bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-sans text-sm text-[#424B2E] placeholder:text-[#5C613E]/50"
              autoFocus
            />
            <input
              type="url"
              placeholder="Link / URL (optional)"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
              className="w-full bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-sans text-sm text-[#424B2E] placeholder:text-[#5C613E]/50"
            />
            <textarea
              placeholder="Notes or further context? (optional)"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className="w-full bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-serif italic text-sm text-[#424B2E] placeholder:text-[#5C613E]/50 resize-none"
            />

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={cancelEditing}
                className="text-xs font-sans uppercase tracking-widest text-[#5C613E]/70 hover:text-[#5C613E]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdate(rec.id)}
                disabled={editRecommendedBy.trim().length < 3 || isUpdating}
                className="px-4 py-2 bg-[#424B2E] text-[#FCF9F2] text-xs font-sans uppercase tracking-widest rounded disabled:opacity-50 hover:bg-[#5C613E] transition-colors"
              >
                {isUpdating ? 'Saving...' : 'Save Context'}
              </button>
            </div>
          </div>
        ) : (
          // DISPLAY MODE
          <div key={rec.id} className="w-full p-4 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/50 group relative">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-semibold text-[#424B2E]">
                  {rec.recommended_by}
                </span>
                {rec.link && (
                  <a
                    href={rec.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#5C613E]/70 hover:text-[#424B2E] transition-colors"
                  >
                    (Source Link)
                  </a>
                )}
              </div>
              {rec.notes && (
                <p className="text-sm font-serif italic text-[#5C613E]/90">
                  {rec.notes}
                </p>
              )}
            </div>

            {/* Hover Edit button which I LOVE! */}
            <button
              onClick={() => startEditing(rec)}
              className="absolute top-4 right-4 text-xs font-sans text-[#5C613E]/50 hover:text-[#424B2E] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Edit
            </button>
          </div>
        )
      ))}

      {/* The Form / Add Button */}
      {isAdding ? (
        <div className="w-full p-4 border-2 border-[#E5E0D8] rounded-md bg-white shadow-sm flex flex-col gap-4 animate-in fade-in duration-200">
          <input
            type="text"
            placeholder="Who recommended this book to you? (Min 3 chars) *"
            value={recommendedBy}
            onChange={(e) => setRecommendedBy(e.target.value)}
            className="w-full bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-sans text-sm text-[#424B2E] placeholder:text-[#5C613E]/50"
            autoFocus
          />
          <input
            type="url"
            placeholder="Link / URL (optional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-sans text-sm text-[#424B2E] placeholder:text-[#5C613E]/50"
          />
          <textarea
            placeholder="Notes or further context? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-transparent border-b border-[#E5E0D8] focus:border-[#424B2E] outline-none py-1 font-serif italic text-sm text-[#424B2E] placeholder:text-[#5C613E]/50 resize-none"
          />

          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={resetForm}
              className="text-xs font-sans uppercase tracking-widest text-[#5C613E]/70 hover:text-[#5C613E]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNew}
              disabled={recommendedBy.trim().length < 3 || isSaving}
              className="px-4 py-2 bg-[#424B2E] text-[#FCF9F2] text-xs font-sans uppercase tracking-widest rounded disabled:opacity-50 hover:bg-[#5C613E] transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Context'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setEditingId(null); setIsAdding(true); }}
          className="w-full min-h-16 p-4 border-2 border-dashed border-[#E5E0D8] hover:border-[#5C613E]/50 hover:bg-white/50 rounded-md text-sm font-serif italic text-[#5C613E]/70 flex items-center justify-center transition-colors cursor-pointer"
        >
          + Add {recs.length > 0 ? 'Another' : 'Recommendation Context'}
        </button>
      )}
    </section>
  )
};