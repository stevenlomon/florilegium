'use client' // The button will need onClick. Is imported onto the Detailed View Page Server Component
import { Book } from '@/lib/types';

interface AddToBookshelfButtonProps {
  book: Book;
}

export default function AddToBookshelfButton({ book }: AddToBookshelfButtonProps) {
  function handleAddToBookshelf() {
    // To be implemented
  }

  return (
    <button
      className="bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-6 py-2.5 rounded hover:bg-[#343b24] transition shadow-sm"
      onClick={handleAddToBookshelf}
    >
      Add to Bookshelf
    </button>
  )
};
