import { useState, useEffect } from 'react';
import type { BookshelfItem } from '@/components/bookshelf/BookshelfClient';

// Modularizing the useEffect in HorizonModal and ReadingTracksModal (and perhaps even more modals to come!) to adhere to DRY principle
export function useBookshelf(isOpen: boolean) {
  const [books, setBooks] = useState<BookshelfItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch if the modal is actually open
    if (!isOpen) return;

    const fetchBookshelf = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/bookshelf');
        if (res.ok) {
          const data = await res.json();
          setBooks(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching user bookshelf:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookshelf();
  }, [isOpen]);

  return { books, isLoading };
}