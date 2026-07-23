'use client'
// The modal that will be shown when clicking an empty Reading Track slot on the Home page. 
// Will share a lot of DNA with the Horizon Modal. Will most likely refactor in the not-too-far future but for now I want
// to keep the momentum going and prioritize speed

import { useState } from 'react';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useBookshelf } from '@/hooks/useBookshelf';
import type { Book, BookshelfItem } from '@/lib/types';

interface ReadingTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: { trackId: number, slotId: number, trackTitle: string } | null // Straight from the Section component, now updated with the title too; not just a simple number anymore haha!
  onSuccess: () => void;
}

export default function ReadingTracksModal({ isOpen, onClose, targetSlot, onSuccess }: ReadingTracksModalProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  // We're gonna have a 2-step modal for assigning a book as Currently Reading in one of the Reading Tracks! stagedBook holds the book 
  // they selected in Step 1. If null, we show the list. It holds the book AND where it came from, so that the master function alter down
  // in the code knows how to save it
  const [stagedBook, setStagedBook] = useState<{ data: BookshelfItem | Book, source: 'UserBookshelf' | 'OpenLibrary' } | null>(null);
  const [customPageCount, setCustomPageCount] = useState<string>("");
  const [initialCurrentPage, setInitialCurrentPage] = useState<string>(""); // New state for the new form input

  const { searchTerm, setSearchTerm, isSearching, results: externalBooks } = useBookSearch("Reading Tracks Modal Search Error:");
  const { books: bookshelfItems, isLoading: isLoadingUserBookshelf } = useBookshelf(isOpen);

  const showExternalResults = searchTerm.trim().length >= 3;

  // The new real-time local filter
  const filteredBookshelf = bookshelfItems.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Updated: We now accept an optional finalPageCount
  // Update #2: We now accept an optional initialCurrentPage!
  const handleAssignBook = async (book: BookshelfItem | Book, source: 'UserBookshelf' | 'OpenLibrary', finalPageCount: number | null = null, startingPage: number = 0) => {
    if (!targetSlot) return;

    setIsAssigning(true);

    try {
      if (source === 'UserBookshelf') {
        const userBookshelfItem = book as BookshelfItem
        console.log(`[Database Action] Assigning user bookshelf item ${userBookshelfItem.bookshelf_item_id} to Reading Track Slot ${targetSlot}`);

        const res = await fetch('/api/tracks/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            track_id: targetSlot.trackId,
            slot_id: targetSlot.slotId,
            bookshelf_item_id: userBookshelfItem.bookshelf_item_id,
            initial_current_page: startingPage
          })
        });

        if (!res.ok) {
          throw new Error(`Failed to assign user bookshelf item to slot ${targetSlot}`);
        }

        // Updated: If the user gives us a custom page count in Step 2 of the 2-step modal, save it!
        if (finalPageCount !== null) {
          await fetch('/api/bookshelf', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookshelf_item_id: userBookshelfItem.bookshelf_item_id,
              custom_page_count: finalPageCount
            })
          });
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
              bookshelf_item_id: newBookshelfItemId,
              initial_current_page: startingPage
            })
          })
          if (!assigningRes.ok) throw new Error(`Failed to assign book to Slot ${targetSlot}`);

          // Updated: If the user gives us a custom page count in Step 2 of the 2-step modal, save it!
          if (finalPageCount !== null) {
            await fetch('/api/bookshelf', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookshelf_item_id: newBookshelfItemId,
                custom_page_count: finalPageCount
              })
            });
          }
        } else { // If we're assigning to Follow-up slot
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

      onSuccess(); // Tell the parent component to refresh the server state
      handleClose(); // Delegate the entire local client state reset, cleanup and closure to our helper function
      onClose();

    } catch (err) {
      console.error("Failed to assign book to Reading Track:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setStagedBook(null); // Wipe the memory so that our 2-step modal returns to Step 1 once a Currently Reading assignment flow is completed
    setCustomPageCount(""); // Also clear the custom_page_count input field for next time while we're here
    setInitialCurrentPage(""); // Needs to be wiped clean too
    onClose();
  };

  // Has one job: grab the custom page count number, parse it, and hands it to the master function
  const handleFinalAssign = async () => {
    if (!stagedBook) return;
    const parsedPageCount = customPageCount.trim() !== "" ? parseInt(customPageCount, 10) : null;
    const parsedCurrentPage = initialCurrentPage.trim() !== "" ? parseInt(initialCurrentPage, 10) : 0;

    // Pass both variables cleanly
    await handleAssignBook(stagedBook.data, stagedBook.source, parsedPageCount, parsedCurrentPage);
  };

  if (!isOpen) return null;

  // Fully vibe coded render return statement
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#FCF9F2] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh] border border-[#E5E0D8]">

        {!stagedBook ? (
          <>
            {/* HEADER */}
            <div className="px-8 pt-8 pb-4 border-b border-[#E5E0D8] bg-white relative">
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
                  placeholder="Search your bookshelf or the archives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isAssigning}
                  autoFocus
                />
              </div>
            </div>

            {/* CONTENT (Scrollable List) v2: Now for both Bookshelf *AND* Open Library! */}
            <div className="flex-1 overflow-y-auto bg-[#FCF9F2] p-2 relative">
              {isAssigning && <div className="absolute inset-0 z-10" />}

              {/* 1. LOCAL BOOKSHELF (Instantly filtered) */}
              {!isLoadingUserBookshelf && filteredBookshelf.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E]">Your Bookshelf</h3>
                  <ul className="flex flex-col gap-1">
                    {filteredBookshelf.map((book: BookshelfItem) => (
                      <li key={book.bookshelf_item_id}>
                        <button
                          onClick={() => targetSlot?.slotId === 1 ? setStagedBook({ data: book, source: 'UserBookshelf' }) : handleAssignBook(book, 'UserBookshelf')}
                          className="w-full text-left p-4 rounded-md transition-colors hover:bg-[#EFEBE1]/60 flex flex-col group"
                        >
                          <span className="text-[#2C302E] font-heading font-normal text-xl leading-tight group-hover:text-[#424B2E]">{book.title}</span>
                          <span className="text-[#5C613E] font-sans text-xs mt-1">{book.author} {book.status_id === 2 && <span className="text-[#424B2E] font-medium ml-2">• Currently Reading</span>}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 2. OPEN LIBRARY ARCHIVES (Appears at 3+ chars) */}
              {showExternalResults && (
                <div className="border-t border-[#E5E0D8]/60 pt-2">
                  <h3 className="px-4 py-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E]">The Archives</h3>
                  {isSearching ? (
                    <div className="p-8 flex justify-center text-[#5C613E] font-sans text-sm">Searching the archives...</div>
                  ) : externalBooks.length > 0 ? (
                    <div className="flex flex-col p-2">
                      <ul className="flex flex-col gap-1 mb-4">
                        {externalBooks.map((book: Book) => (
                          <li key={book.id}>
                            <button
                              onClick={() => targetSlot?.slotId === 1 ? setStagedBook({ data: book, source: 'OpenLibrary' }) : handleAssignBook(book, 'OpenLibrary')}
                              className="w-full text-left p-4 rounded-md transition-colors hover:bg-[#EFEBE1]/60 flex flex-col group"
                            >
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
                  )}
                </div>
              )}

              {/* ZERO STATE */}
              {!showExternalResults && filteredBookshelf.length === 0 && (
                <div className="p-12 flex justify-center text-[#5C613E] font-sans text-sm text-center flex-col items-center">
                  <span className="text-3xl opacity-30 mb-3">🌿</span>
                  <p>No matches in your bookshelf.</p>
                  <p className="mt-1 opacity-70">Keep typing to search the archives.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl text-[#2C302E] font-serif mb-1">
                  Starting {stagedBook.data.title}
                </h2>
                <p className="text-[#5C613E] text-sm">
                  {targetSlot?.trackTitle} Track
                </p>
              </div>
              <button onClick={handleClose} disabled={isAssigning} className="text-[#5C613E] hover:text-[#2C302E] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* The Prompt */}
            <div className="bg-[#EFEBE1]/50 p-5 rounded border border-[#E5E0D8] mb-8 mt-2">

              {/* ZONE 1: Gentle Context Nudge */}
              <p className="text-[#2C302E] text-sm mb-5 leading-relaxed">
                Set up progress tracking for your edition.
              </p>

              {/* ZONE 2: Two-Column Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-2">

                {/* Total Pages Column */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5C613E]">
                    Total Pages in Edition
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={customPageCount}
                    onChange={(e) => setCustomPageCount(e.target.value)}
                    placeholder={stagedBook.data.page_count ? `e.g., ${stagedBook.data.page_count}` : "e.g., 288"}
                    className="w-full bg-[#FCF9F2] border border-[#E5E0D8] rounded px-3 py-2 text-sm text-[#2C302E] placeholder:text-[#5C613E]/50 focus:outline-none focus:border-[#424B2E] transition-colors shadow-sm"
                  />
                  <span className="text-[10px] text-[#5C613E] italic font-serif">
                    {stagedBook.data.page_count
                      ? `*If skipped, we'll use ~${stagedBook.data.page_count}.`
                      : "*If skipped, we'll estimate."}
                  </span>
                </div>

                {/* Current Page Column */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5C613E]">
                    Current Page
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    value={initialCurrentPage}
                    onChange={(e) => setInitialCurrentPage(e.target.value)}
                    placeholder="e.g., 43"
                    className="w-full bg-[#FCF9F2] border border-[#E5E0D8] rounded px-3 py-2 text-sm text-[#2C302E] placeholder:text-[#5C613E]/50 focus:outline-none focus:border-[#424B2E] transition-colors shadow-sm"
                  />
                  <span className="text-[10px] text-[#5C613E] italic font-serif">
                    *If skipped, starts at page 0.
                  </span>
                </div>

              </div>

              {/* ZONE 3: Subtle Re-read Footnote */}
              <div className="mt-6 pt-4 border-t border-[#E5E0D8]">
                <p className="text-[11px] text-[#5C613E] font-serif italic">
                  🌿 Re-reading? You can log past journeys anytime from your Bookshelf.
                </p>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D8]">
              <button
                onClick={() => setStagedBook(null)}
                disabled={isAssigning}
                className="text-[#5C613E] font-sans text-sm font-medium hover:text-[#2C302E] transition-colors disabled:opacity-50"
              >
                ← Back to list
              </button>

              <button
                onClick={handleFinalAssign}
                disabled={isAssigning}
                className="bg-[#424B2E] text-[#FCF9F2] font-sans text-sm font-medium tracking-wide px-6 py-2 rounded hover:bg-[#343b24] transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAssigning ? "Starting..." : "Start Reading"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
};