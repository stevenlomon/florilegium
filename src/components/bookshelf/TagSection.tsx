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
  // Further state to be added here as needed

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
      // Code to be added here
    }
  }

  return (
    // Return render statement to be added here
    <>
    </>
  );
}