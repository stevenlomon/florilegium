'use client' // The button will need onClick. Is imported onto the Detailed View Page Server Component
import { Book } from '@/lib/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddToBookshelfButtonProps {
  book: Book;
  isAlreadyInBookshelf: boolean;
}

export default function AddToBookshelfButton({ book, isAlreadyInBookshelf }: AddToBookshelfButtonProps) {
  const [buttonText, setButtonText] = useState(isAlreadyInBookshelf ? "Resting in Bookshelf" : "Add to Bookshelf"); // buttonText is now conditional from the very get-go thanks to server side seeding!
  const [isProcessing, setIsProcessing] = useState(false); // A boolean to lock the button while fetching or showing success

  const router = useRouter(); // Needed for router.refresh() in the success state

  async function handleAddToBookshelf() {
    console.log(`Preparing to save "${book.title}" to the database...`);

    // Lock the button immediately and give visual loading feedback
    setIsProcessing(true);
    setButtonText("Adding...");

    try {
      // Upsert the book into our local Book table
      const res = await fetch('/api/book', {
        'method': 'POST',
        'body': JSON.stringify({
          "title": book.title,
          "author": book.authors.map(a => a.name).join(', ') || 'Unknown Author', // Open Library gives us an object. Extract the names into a clean, comma-separated string
          "external_provider": 'Open Library',
          "external_id": book.id,
          "page_count": book.page_count,
          "cover_image_url": book.cover_image
        })
      });

      const addedBookResponse = await res.json(); // Extracting the id of the added book is now possible thanks to the change in the Route Handler!

      // Safety check just in case the upsert failed
      if (!addedBookResponse.data?.id) {
        throw new Error("Failed to retrieve the local database ID for this book.");
      }

      console.log("Successfully upserted book. Local DB ID:", addedBookResponse.data.id);

      // Create the Bookshelf Item instance and add the relationship to the Bookshelf_Item table
      const itemRes = await fetch('/api/bookshelf', {
        'method': 'POST',
        'body': JSON.stringify({
          "book_id": addedBookResponse.data.id,
          "status_id": 1 // Default to 1:Want to Read for now
        })
      });

      if (!itemRes.ok) throw new Error("Failed to link book to user's bookshelf.");

      console.log("Successfully added to Bookshelf!");

      // Success state updated to integrate with the server side seeding
      setButtonText("Added ✓");
      setTimeout(() => {
        setButtonText("Add to Bookshelf"); // Lock it into the finished state
        // setIsProcessing(false); // "Unlock the button again" -> Do not unlock the button!
        router.refresh(); // Tell the parent server component to update in the background
      }, 1500);
    } catch (err) {
      console.error("Failed to add book to bookshelf:", err);

      // Error state: Let the user know, then reset
      setButtonText("Error!");
      setTimeout(() => {
        setButtonText("Add to Bookshelf");
        setIsProcessing(false);
      }, 1500);
    }
  };

  // We disable the button if it's processing OR if the book is already in the bookshelf
  const isDisabled = isProcessing || buttonText === "Resting in Bookshelf";

  return (
    <button
      className={`w-full font-sans text-xs font-bold tracking-widest uppercase py-3.5 px-8 rounded-md transition-all shadow-sm text-center
        ${isDisabled
          ? 'bg-[#E5E0D8] text-[#5C613E] cursor-not-allowed opacity-80'
          : 'bg-[#424B2E] text-[#FCF9F2] hover:bg-[#343b24] hover:shadow-md'
        }`}
      onClick={handleAddToBookshelf}
      disabled={isDisabled}
    >
      {buttonText}
    </button>
  )
};