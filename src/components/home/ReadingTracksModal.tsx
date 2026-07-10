'use client'
// The modal that will be shown when clicking an empty Reading Track slot on the Home page. 
// Will share a lot of DNA with the Horizon Modal. Will most likely refactor in the not-too-far future but for now I want
// to keep the momentum going and prioritize speed

import { useState, useEffect } from 'react';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useBookshelf } from '@/hooks/useBookshelf';
import type { Book } from '@/lib/types';

export interface UserBookshelfItem {
  bookshelf_item_id: string;
  status_id: number;
  horizon_slot: number | null;
  book_id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  page_count: number | null;
}

interface ReadingTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: { trackId: string, slotId: number, trackTitle: string } | null // Straight from the Section component, now updated with the title too; not just a simple number anymore haha!
  onSuccess: () => void;
}

export default function ReadingTracksModal({ isOpen, onClose, targetSlot, onSuccess }: ReadingTracksModalProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  const { searchTerm, setSearchTerm, isSearching, results: externalBooks } = useBookSearch("Reading Tracks Modal Search Error:");
  const { books: bookshelfItems, isLoading: isLoadingUserBookshelf } = useBookshelf(isOpen);

  const showExternalResults = searchTerm.trim().length >= 3;

  const handleAssignBook = async (book: UserBookshelfItem | Book, source: 'UserBookshelf' | 'OpenLibrary') => {
    if (!targetSlot) return;

    setIsAssigning(true);

    try {
      if (source === 'UserBookshelf') {
        const userBookshelfItem = book as UserBookshelfItem
        console.log(`[Database Action] Assigning user bookshelf item ${userBookshelfItem.bookshelf_item_id} to Reading Track Slot ${targetSlot}`);

        const res = await fetch('/api/tracks/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            track_id: targetSlot.trackId,
            slot_id: targetSlot.slotId,
            bookshelf_item_id: userBookshelfItem.bookshelf_item_id
          })
        });

        if (!res.ok) {
          throw new Error(`Failed to assign user bookshelf item to slot ${targetSlot}`);
        }
      } else {
        const openLibraryBook = book as Book
        console.log(`[Database Action] Saving "${openLibraryBook.title}" to DB, then assigning to Reading Track Slot ${targetSlot}`);

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
        const localBookId = bookData.data.id;

        // Secondly we insert it into the user's Bookshelf and assign the Reading Track slot
        // And this is conditional depending on which slot the user clicked!

        const isAssigningCurrentlyReading = targetSlot.slotId === 1;
        if (isAssigningCurrentlyReading) {
          // Insert the Bookshelf Item with status 2: "Currently Reading"
          const bookshelfRes = await fetch('/api/bookshelf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              book_id: localBookId,
              status_id: 2,
            })
          });

          if (!bookshelfRes.ok) throw new Error(`Failed to insert local book with id ${localBookId} into User Bookshelf`);

          const bookshelfItemData = await bookshelfRes.json();
          const newBookshelfItemId = bookshelfItemData.data.id;

          // Now finally, with the item in the user's Bookshelf, we actually assign it using our new absolute unit of a Route Handler
          const assigningRes = await fetch('/api/tracks/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              track_id: targetSlot.trackId,
              slot_id: targetSlot.slotId,
              bookshelf_item_id: newBookshelfItemId
            })
          })
          if (!assigningRes.ok) throw new Error(`Failed to assign book to Slot ${targetSlot}`);
        } else {
          // Insert the Bookshelf Item with status 1: "Want to Read"
          const bookshelfRes = await fetch('/api/bookshelf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              book_id: localBookId,
              status_id: 1,
            })
          });

          if (!bookshelfRes.ok) throw new Error(`Failed to insert local book with id ${localBookId} into User Bookshelf`);

          const bookshelfItemData = await bookshelfRes.json();
          const newBookshelfItemId = bookshelfItemData.data.id;

          // Now finally, with the item in the user's Bookshelf, we actually assign it using our new absolute unit of a Route Handler
          const assigningRes = await fetch('/api/tracks/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              track_id: targetSlot.trackId,
              slot_id: targetSlot.slotId,
              bookshelf_item_id: newBookshelfItemId
            })
          })
          if (!assigningRes.ok) throw new Error(`Failed to assign book to Slot ${targetSlot}`);
        }
      }

      onSuccess();
      setSearchTerm('');
      onClose();

    } catch (err) {
      console.error("Failed to assign book to Reading Track:", err);
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
              <span className="font-sans text-sm text-[#424B2E] font-medium animate-pulse">Assigning book to Reading Track...</span>
            </div>
          )}

          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-heading text-2xl text-[#2C302E] tracking-wide mb-1">
                Assigning to {targetSlot?.trackTitle}
              </h2>
              <p className="font-sans text-sm text-[#5C613E]">
                Select a book for your {targetSlot?.slotId === 1 ? 'Currently Reading' : 'Up Next'} slot.
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
              placeholder="Search library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isAssigning}
              autoFocus
            />
          </div>
        </div>

        {/* CONTENT (Scrollable List) */}
        <div className="flex-1 overflow-y-auto bg-[#FCF9F2] p-2 relative">

          {/* Prevent clicks while assigning */}
          {isAssigning && <div className="absolute inset-0 z-10" />}

          {showExternalResults ? (
            isSearching ? (
              <div className="p-12 flex justify-center text-[#5C613E] font-sans text-sm">Searching the archives...</div>
            ) : externalBooks.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {externalBooks.map((book: Book) => (
                  <li key={book.id}>
                    <button onClick={() => handleAssignBook(book, 'OpenLibrary')} className="w-full text-left p-4 rounded-md transition-colors hover:bg-[#EFEBE1]/60 flex flex-col group">
                      <span className="text-[#2C302E] font-heading font-normal text-xl leading-tight group-hover:text-[#424B2E]">{book.title}</span>
                      <span className="text-[#5C613E] font-sans text-xs mt-1">{book.authors?.[0]?.name || 'Unknown Author'} <span className="opacity-50">• Open Library</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-12 flex justify-center text-[#5C613E] font-sans text-sm">No works found in the catalog.</div>
            )
          ) : (
            isLoadingUserBookshelf ? (
              <div className="p-12 flex justify-center text-[#5C613E] font-sans text-sm">Retrieving your bookshelf...</div>
            ) : bookshelfItems.length > 0 ? (
              <div>
                <h3 className="px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E]">Your Bookshelf</h3>
                <ul className="flex flex-col gap-1">
                  {bookshelfItems.map((book: UserBookshelfItem) => (
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
  )
};