'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Tag } from '@/lib/types';

interface TagSectionProps {
  bookshelfItemId: string;
  existingTags: Tag[];

  // In addition to all existing tags, we pass *all* the tags that the user has created so that we don't have to make API
  // requests on every keystroke for the auto-complete!
  allUserTags: Tag[]; 
}

// The core interaction idea from the group project (type text, press Enter to add, click × to remove) is the same but none of the actual code
export default function TagSection({ bookshelfItemId, existingTags, allUserTags }: TagSectionProps) {
  const [tags, setTags] = useState<Tag[]>(existingTags); // Pre-filled by the prop
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null); // The text input element
  const suggestionsRef = useRef<HTMLDivElement>(null); // The dropdown list below it
  
  const router = useRouter();

  useEffect(() => {
    // Without this useEffect, the dropdown would stat open forever until the user pressed Escape or typed something. 
    // Clicking elsewhere on the modal should dismiss it; this is the golden standard UX for dropdowns
    const handleClickOutside = (e: MouseEvent) => {
      if (
        // "Has the user clicked somewhere that is NOT inside the suggestions dropdown AND NOT inside the input field?"
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        // If so, close the suggestions list
        setShowSuggestions(false);
      }
    };
    // This registers the listener on the entire page and checks if the click is outside both the input and the dropdown
    document.addEventListener('mousedown', handleClickOutside);

    // The important-to-not-forget cleanup function
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // The no-API request auto-complete suggestions!
  const suggestions = allUserTags.filter(
    (t) =>
      t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.some((existing) => existing.id === t.id) // Only keep suggestions where the tag is *not* already attached
  );

  // One helper function if the tag already exists in the database...
  const attachTag = async (tag: Tag) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/bookshelf/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookshelf_item_id: bookshelfItemId, tag_id: tag.id }),
      });

      if (!res.ok) throw new Error('Failed to attach tag');

      setTags((prev) => [...prev, tag]);
      setInputValue('');
      setShowSuggestions(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // ...and one if it doesn't. `handleKeyDown` decides which one to call
  const createAndAttachTag = async (name: string) => {
    setIsSaving(true);
    try {
      const createRes = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        if (createRes.status === 409) {
          alert('Tag already exists'); // TODO: ugly altert for now for testing; polish it up later
        } else {
          throw new Error(data.error || 'Failed to create tag');
        }
        return;
      }

      const { data: newTag } = await createRes.json();

      await attachTag(newTag); // This one calls the other helper function
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const detachTag = async (tagId: number) => {
    try {
      const res = await fetch('/api/bookshelf/tags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookshelf_item_id: bookshelfItemId, tag_id: tagId }),
      });

      if (!res.ok) throw new Error('Failed to detach tag');

      setTags((prev) => prev.filter((t) => t.id !== tagId));
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  // If the typed text matches an existing tag (case-insensitive), it attaches that one. 
  // Otherwise it creates a new tag AND attaches it in sequence.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      // This is different from suggestions and auto-completion. This is looking for full exact matches to decide
      // "Do we attach this existing tag or create a new one and attach it?"
      const existingMatch = allUserTags.find(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase()
      );

      if (existingMatch) {
        if (!tags.some((t) => t.id === existingMatch.id)) {
          attachTag(existingMatch);
        }
      } else {
        createAndAttachTag(trimmed);
      }
    }
  };

  return (
    <section>
      <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-3">
        Tags
      </h3>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#424B2E]/10 text-[#424B2E] text-sm font-sans rounded-full border border-[#424B2E]/20"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => detachTag(tag.id)}
              className="text-[#424B2E]/50 hover:text-[#8C3A3A] transition-colors font-bold"
              title={`Remove ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}

        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            placeholder="+ Add a tag"
            size={Math.max(inputValue.length + 1, 10)}
            className="px-6 py-2.5 text-sm font-sans rounded-full border border-dashed border-[#E5E0D8] hover:border-[#5C613E]/50 hover:bg-white/50 focus:border-[#424B2E] bg-transparent outline-none text-[#424B2E] placeholder:text-[#5C613E]/50 transition-colors disabled:opacity-50"
          />

          {showSuggestions && inputValue.trim() && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 left-0 mt-1 bg-white border border-[#E5E0D8] rounded-md shadow-lg max-h-40 overflow-y-auto min-w-[160px]"
            >
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => attachTag(tag)}
                  className="w-full text-left px-3 py-2 text-sm font-sans text-[#424B2E] hover:bg-[#424B2E]/5 transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}