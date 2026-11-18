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

export default function TagSection({ bookshelfItemId, existingTags, allUserTags }: TagSectionProps) {
  const [tags, setTags] = useState<Tag[]>(existingTags); // Pre-filled by the prop
  const [inputValue, setInputValue] = useState('');
  // Further state to be added here as needed

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Code to be added here
    }
  }, []);

  // The no-API request auto-complete suggestions!
  const suggestions = allUserTags.filter(
    (t) =>
      t.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.some((existing) => existing.id === t.id) // Only keep suggestions where the tag is *not* already attached
  );

  const attachTag = async (tag: Tag) => {
    // Code to be added here
  }

  const createAndAttachTag = async (name: string) => {
    // Code to be added here
  }

  const detachTag = async (tagId: number) => {
    // Code to be added here
  }

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