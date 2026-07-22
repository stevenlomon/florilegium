'use client'
// The modal that will be shown when clicking an empty Horizon Book slot on the Profile page

import { useState } from 'react';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useBookshelf } from '@/hooks/useBookshelf';
import type { Book, BookshelfItem } from '@/lib/types';

interface HorizonModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: number | null; // 1, 2, 3, 4, or 5
  onSuccess: () => void;     // Just a simple trigger to tell the Profile page to refresh
}

export default function HorizonModal({ isOpen, onClose, targetSlot, onSuccess }: HorizonModalProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  // Our Book search hook in action!
  const { searchTerm, setSearchTerm, isSearching, results: externalBooks } = useBookSearch("Horizon Modal Search Error:");

  // And our new Bookshelf hook in action!
  const { books: bookshelfBooks, isLoading: isLoadingUserBookshelf } = useBookshelf(isOpen);

  const showExternalResults = searchTerm.trim().length >= 3; // Derived state! Does *not* need to be a state variable using `useState`!

  const handleAssignBook = async (book: BookshelfItem | Book, source: 'UserBookshelf' | 'OpenLibrary') => {
    if (!targetSlot) return;

    setIsAssigning(true);

    try {
      if (source === 'UserBookshelf') {
        const userBookshelfItem = book as BookshelfItem // Type Assertion to calm TS down haha
        console.log(`[Database Action] Assigning user bookshelf item ${userBookshelfItem.bookshelf_item_id} to Horizon Slot ${targetSlot}`);

        const res = await fetch('/api/bookshelf/horizon', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookshelf_item_id: userBookshelfItem.bookshelf_item_id,
            horizon_slot: targetSlot
          })
        });

        if (!res.ok) {
          throw new Error(`Failed to assign user bookshelf item to slot ${targetSlot}`);
        }
      } else {
        const openLibraryBook = book as Book
        console.log(`[Database Action] Saving "${openLibraryBook.title}" to DB, then assigning to Horizon Slot ${targetSlot}`);

        // First we upsert the book into our local Book table
        const bookRes = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: openLibraryBook.title,
            author: openLibraryBook.authors?.[0]?.name || 'Unknown Author',
            external_provider: 'open_library',
            external_id: openLibraryBook.id,
            page_count: openLibraryBook.page_count || null,
            cover_image_url: openLibraryBook.cover_image || null,
          })
        });

        if (!bookRes.ok) throw new Error("Failed to save book to local database");
        const bookData = await bookRes.json();
        const localBookId = bookData.data.id; // We grab the new Postgres ID!

        // Now, we insert it into the user's Bookshelf and assign the Horizon slot
        const bookshelfRes = await fetch('/api/bookshelf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book_id: localBookId,
            status_id: 1, // Defaulting Horizon books as 1:"Want to Read" for now
            horizon_slot: targetSlot // Passing the slot along! And this will need a change in the Route Handler
          })
        });

        if (!bookshelfRes.ok) throw new Error(`Failed to assign book to Slot ${targetSlot}`);
      }

      onSuccess();
      setSearchTerm('');
      onClose();

    } catch (err) {
      console.error("Failed to assign book to Horizon:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  // Fully vibe coded render return statement
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#FCF9F2] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh] border border-[#E5E0D8]">

        {/* HEADER */}
        <div className="px-8 pt-8 pb-4 border-b border-[#E5E0D8] bg-white relative">
          
          {/* Loading Overlay when assigning */}
          {isAssigning && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <span className="font-sans text-sm text-[#424B2E] font-medium animate-pulse">Assigning masterpiece...</span>
            </div>
          )}

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-heading text-2xl text-[#2C302E] tracking-wide mb-1">
                Assign a Horizon Book
              </h2>
              <p className="font-sans text-sm text-[#5C613E]">
                Select from your Bookshelf or search the archives for Slot {targetSlot}.
              </p>
            </div>
            <button onClick={handleClose} disabled={isAssigning} className="text-[#5C613E] hover:text-[#2C302E] p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div className="flex items-center rounded-md bg-[#EFEBE1] px-4 py-3 border border-transparent focus-within:border-[#424B2E] focus-within:ring-1 focus-within:ring-[#424B2E]">
            <span className="text-[#5C613E] mr-3 opacity-70">
              {showExternalResults && isSearching ? '⏳' : '🔍'}
            </span>
            <input
              className="w-full bg-transparent text-sm font-sans text-[#2C302E] outline-none placeholder:text-[#5C613E]"
              type="text"
              placeholder="Search the archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isAssigning}
              autoFocus
            />
          </div>
        </div>

        {/* CONTENT (Scrollable List) - Swamp Drained! */}
        <div className="flex-1 overflow-y-auto bg-[#FCF9F2] p-2 relative">
          {isAssigning && <div className="absolute inset-0 z-10" />}

          {showExternalResults ? (
            isSearching ? (
              <div className="p-12 flex justify-center text-[#5C613E] font-sans text-sm">Searching the archives...</div>
            ) : externalBooks.length > 0 ? (
              <div className="flex flex-col p-2">
                <ul className="flex flex-col gap-1 mb-4">
                  {externalBooks.map((book: Book) => (
                    <li key={book.id}>
                      <button onClick={() => handleAssignBook(book, 'OpenLibrary')} className="w-full text-left p-4 rounded-md transition-colors hover:bg-[#EFEBE1]/60 flex flex-col group">
                        <span className="text-[#2C302E] font-heading font-normal text-xl leading-tight group-hover:text-[#424B2E]">{book.title}</span>
                        <span className="text-[#5C613E] font-sans text-xs mt-1">{book.authors?.[0]?.name || 'Unknown Author'} <span className="opacity-50">• Open Library</span></span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Cozy, muted footer placed cleanly outside the list */}
                <p className="text-[11px] font-serif italic text-[#5C613E]/60 text-center pt-4 border-t border-[#E5E0D8]/60 mx-4">
                  All book data provided by{' '}
                  <a
                    href='https://archive.org/donate/?platform=ol'
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#424B2E] not-italic font-sans text-[9px] font-bold tracking-widest underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] transition-colors mx-0.5"
                  >
                    Open Library
                  </a>
                  . Consider donating to their cause.
                </p>
              </div>
            ) : (
              <div className="p-12 flex justify-center text-[#5C613E] font-sans text-sm">No works found in the catalog.</div>
            )
          ) : (
            isLoadingUserBookshelf ? (
              <div className="p-12 flex justify-center text-[#5C613E] font-sans text-sm">Retrieving your bookshelf...</div>
            ) : bookshelfBooks.length > 0 ? (
              <div>
                <h3 className="px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E]">Your Bookshelf</h3>
                <ul className="flex flex-col gap-1">
                  {bookshelfBooks.map((book: BookshelfItem) => (
                    <li key={book.bookshelf_item_id}>
                      <button onClick={() => handleAssignBook(book, 'UserBookshelf')} className="w-full text-left p-4 rounded-md transition-colors hover:bg-[#EFEBE1]/60 flex flex-col group">
                        <span className="text-[#2C302E] font-heading font-normal text-xl leading-tight group-hover:text-[#424B2E]">{book.title}</span>
                        <span className="text-[#5C613E] font-sans text-xs mt-1">{book.author} {book.status_id === 2 && <span className="text-[#424B2E] font-medium ml-2">• Currently Reading</span>}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-12 flex justify-center text-[#5C613E] font-sans text-sm text-center flex-col items-center">
                <span className="text-3xl opacity-30 mb-3">🌿</span>
                <p>Your bookshelf is currently empty.</p>
                <p className="mt-1 opacity-70">Type above to search the archives.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};