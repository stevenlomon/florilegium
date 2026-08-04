'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { type BookshelfItem, Edition } from '@/lib/types';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import StarRating from './StarRating';
import StatusDropdown from './StatusDropdown';
import RecommendationContextSection from './RecommendationContextSection';
import ReviewSection from './ReviewSection';
import JourneyTimeline from './JourneyTimeline';
import EditionSwitcherModal from '../shared/EditionSwitcherModal';

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookshelfItem | null;
}

export default function BookDetailsModal({ isOpen, onClose, book }: BookDetailsModalProps) {
  // Edition Switching state
  const [isEditionModalOpen, setIsEditionModalOpen] = useState(false);
  const [isUpdatingEdition, setIsUpdatingEdition] = useState(false);

  // Bookshelf item deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // New state for tracking image loading errors
  const [imageFailed, setImageFailed] = useState(false);

  // Our new useEscapeKey custom hook! Simply listens for changes in the isOpen state
  useEscapeKey(onClose, isOpen);

  const router = useRouter(); // For router.refresh()! Also needs to placed here; hooks must be called before any if statements! I didn't know this!

  if (!isOpen || !book) return null;

  // The function to talk to our newly created user rating PATCH route
  const handleRatingUpdate = async (newRating: number | null) => {
    try {
      const res = await fetch('/api/bookshelf', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: book.bookshelf_item_id,
          user_rating: newRating
        })
      });

      if (!res.ok) throw new Error("Failed to update rating");

      // Tell Next.js to re-fetch the server component data so that the grid updates instantly!
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save rating. Please try again.");
    }
  };

  // And another one to handle status updates!
  const handleStatusUpdate = async (newStatusId: number) => {
    try {
      const res = await fetch('/api/bookshelf', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: book.bookshelf_item_id,
          status_id: newStatusId
        })
      });

      if (!res.ok) throw new Error("Failed to update status");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to update status. Please try again.");
    }
  };

  // Handle selecting a new edition for a book already on the bookshelf
  const handleEditionSelect = async (edition: Edition) => {
    setIsUpdatingEdition(true);
    try {
      // Upsert the new edition into our local Book table
      const bookRes = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: edition.title,
          author: book.author,
          external_provider: 'Open Library',
          external_id: edition.id,
          page_count: edition.page_count,
          cover_image_url: edition.cover_image_url,
        }),
      });

      if (!bookRes.ok) throw new Error("Failed to upsert selected edition");
      const bookData = await bookRes.json();
      const newBookId = bookData.data.id;

      // Update the Bookshelf_Item to point to the new local book_id
      const shelfRes = await fetch('/api/bookshelf', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookshelf_item_id: book.bookshelf_item_id,
          book_id: newBookId,
        }),
      });

      if (!shelfRes.ok) throw new Error("Failed to update bookshelf item edition");

      // And finally close modal and refresh server state with router.refresh()!
      setIsEditionModalOpen(false);
      setImageFailed(false); // Put here rather than in a useEffect which is considered an "anti-pattern" in React. This touches upon a the "Cascading Render" error, which I wanna make a deep dive on. But not now. Dr. Oak Principle; "There's a time and place for everything"

      router.refresh();
    } catch (error) {
      console.error("Error switching edition on bookshelf:", error);
      alert("Failed to switch edition. Please try again.");
    } finally {
      setIsUpdatingEdition(false);
    }
  };

  // Our Safety Net: Helper boolean to determine if there is connected data that will prevent the book from being able to be deleted
  const hasConnectedData =
    book.user_rating !== null ||
    (book.review !== null && book.review.trim() !== '') ||
    (book.journeys && book.journeys.length > 0) ||
    (book.recommendation_context && book.recommendation_context.length > 0);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/bookshelf', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookshelf_item_id: book.bookshelf_item_id })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove book");
      }

      // Close the modal and let the server seed the updated UI
      onClose();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to remove book. Please try again.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl bg-[#FCF9F2] rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden border border-[#E5E0D8]">

          {/* HEADER: Cover, Title, Status, & Rating */}
          <div className="flex gap-6 p-8 border-b border-[#E5E0D8] bg-white relative shrink-0">
            <button onClick={onClose} className="absolute top-6 right-6 text-[#5C613E] hover:text-[#2C302E] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Miniature Cover */}
            <Link href={`/book/${book.external_id}`}>
              <div className="relative w-24 h-36 rounded shadow-sm border border-[#E5E0D8] overflow-hidden shrink-0 bg-[#EFEBE1]/50">
                {/* UPDATED: The Image Fallback Logic */}
                {book.cover_image_url && !imageFailed ? (
                  <Image
                    src={book.cover_image_url}
                    alt={book.title}
                    fill
                    sizes='96px' // To silence "[browser] Image with src "https://covers.openlibrary.org/b/id/10590366-L.jpg" has "fill" but is missing "sizes" prop. Please add it to improve page performance." warning
                    className="object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                    <span className="font-heading text-[#2C302E] text-[10px] leading-tight line-clamp-3">{book.title}</span>
                  </div>
                )}
              </div>
            </Link>


            {/* Core Metadata */}
            <div className="flex flex-col justify-center flex-1">
              <h2 className="font-heading text-3xl text-[#2C302E] leading-tight mb-1">{book.title}</h2>
              <p className="font-sans text-sm text-[#5C613E] mb-6">{book.author}</p>

              {/* SWITCH EDITION BUTTON FOR THE BOOKSHELF UI */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setIsEditionModalOpen(true)}
                  disabled={isUpdatingEdition}
                  className="text-[#424B2E] font-medium underline underline-offset-4 decoration-[#424B2E]/30 hover:decoration-[#424B2E] hover:text-[#2C302E] transition-colors text-xs tracking-wide uppercase disabled:opacity-50"
                >
                  {isUpdatingEdition ? "Switching..." : "Switch Edition"}
                </button>
              </div>

              <div className="flex items-center gap-4">
                {/* READ STATUS (Now conditional! Only show it if Read Status is "Intend", "Read", or "Dropped". Not "Currently Reading") */}
                <div className="pl-4 border-l border-[#E5E0D8] flex items-center">
                  {Number(book.status_id) === 2 ? (
                    <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#424B2E] bg-[#EFEBE1]/50 px-3 py-1.5 rounded border border-[#E5E0D8]">
                      Currently Reading
                    </span>
                  ) : (
                    <StatusDropdown currentStatusId={book.status_id} onStatusChange={handleStatusUpdate} />
                  )}
                </div>

                {/* USER RATINGS COMPONENT */}
                <div className="pl-4 border-l border-[#E5E0D8]">
                  <StarRating initialRating={book.user_rating} onRate={handleRatingUpdate} />
                </div>
              </div>
            </div>
          </div>

          {/* BODY: Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10">

            {/* RECOMMENDATION CONTEXT */}
            <RecommendationContextSection bookshelfItemId={book.bookshelf_item_id} existingRecs={book.recommendation_context} />

            {/* USER REVIEW */}
            <ReviewSection bookshelfItemId={book.bookshelf_item_id} initialReview={book.review} />

            {/* JOURNEYS TIMELINE */}
            <section>
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-3">Reading Journeys</h3>
              <JourneyTimeline 
                bookshelfItemId={book.bookshelf_item_id} 
                journeys={book.journeys} 
                statusId={book.status_id} // New prop in order to generate the new "JOURNEY ON HOLD" and "JOURNEY ENDED" statuses
              />
            </section>

            {/* The Deletion Zone at the very bottom */}
            <div className="mt-2 pt-8 border-t border-[#E5E0D8] flex flex-col items-end">
              <div className="flex flex-col items-end">
                <button
                  type="button"
                  disabled={isDeleting || hasConnectedData}
                  onClick={() => {
                    if (!confirmDelete) {
                      setConfirmDelete(true);
                    } else {
                      handleDelete();
                    }
                  }}
                  onMouseLeave={() => setConfirmDelete(false)} // Gracefully reset if the mouse slips away
                  title={hasConnectedData ? "Clear all connected data to remove this book" : "Remove from Bookshelf"}
                  className={`px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest rounded transition-all ${hasConnectedData
                    ? 'text-[#8C3A3A]/30 cursor-not-allowed'
                    : confirmDelete
                      ? 'bg-[#8C3A3A] text-white shadow-sm'
                      : 'text-[#8C3A3A]/70 hover:text-[#8C3A3A] hover:bg-[#8C3A3A]/10'
                    } disabled:opacity-50`}
                >
                  {isDeleting
                    ? 'Removing...'
                    : confirmDelete
                      ? 'Confirm Removal?'
                      : 'Remove from Bookshelf'}
                </button>

                {/* The Safety Net Label */}
                {hasConnectedData && (
                  <span className="text-[11px] font-serif italic text-[#8C3A3A]/60 mt-2 max-w-xs text-right pr-1">
                    *Clear all connected data (reviews, ratings, journeys, recommendations) to remove this book from your Bookshelf.
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* EDITION SWITCHER MODAL FOR BOOKSHELF */}
      <EditionSwitcherModal
        isOpen={isEditionModalOpen}
        onClose={() => setIsEditionModalOpen(false)}
        workId={book.external_id as string} // Automatically handles Work IDs or Edition IDs via Option B!
        currentEditionId={book.external_id}
        onSelectEdition={handleEditionSelect}
      />
    </>
  )
};