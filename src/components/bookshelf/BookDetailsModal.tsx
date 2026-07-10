'use client'

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type BookshelfItem } from '@/lib/types';
import StarRating from './StarRating';

interface BookDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookshelfItem | null;
}

export default function BookDetailsModal({ isOpen, onClose, book }: BookDetailsModalProps) {
  if (!isOpen || !book) return null;

  const router = useRouter(); // For router.refresh()!

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#FCF9F2] rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden border border-[#E5E0D8]">
        
        {/* HEADER: Cover, Title, Status, & Rating */}
        <div className="flex gap-6 p-8 border-b border-[#E5E0D8] bg-white relative shrink-0">
          <button onClick={onClose} className="absolute top-6 right-6 text-[#5C613E] hover:text-[#2C302E] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Miniature Cover */}
          <div className="relative w-24 h-36 rounded shadow-sm border border-[#E5E0D8] overflow-hidden shrink-0 bg-[#EFEBE1]">
            {book.cover_image_url && (
              <Image 
              src={book.cover_image_url} 
              alt={book.title} 
              fill 
              sizes='96px' // To silence "[browser] Image with src "https://covers.openlibrary.org/b/id/10590366-L.jpg" has "fill" but is missing "sizes" prop. Please add it to improve page performance." warning
              className="object-cover" 
              />
            )}
          </div>

          {/* Core Metadata */}
          <div className="flex flex-col justify-center flex-1">
            <h2 className="font-heading text-3xl text-[#2C302E] leading-tight mb-1">{book.title}</h2>
            <p className="font-sans text-sm text-[#5C613E] mb-6">{book.author}</p>
            
            <div className="flex items-center gap-4">
              {/* STATUS PLACEHOLDER */}
              <div className="px-4 py-2 border-2 border-dashed border-[#E5E0D8] rounded-md text-xs font-sans font-medium text-[#5C613E] bg-[#EFEBE1]/30">
                [Status Dropdown Placeholder]
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
          
          {/* RECOMMENDATION CONTEXT PLACEHOLDER */}
          <section>
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-3">Recommendation Context</h3>
            <div className="w-full min-h-20 p-4 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/50 text-sm font-serif italic text-[#5C613E]/70 flex items-center justify-center">
              [Text area: Who recommended this and why?]
            </div>
          </section>

          {/* REVIEW PLACEHOLDER */}
          <section>
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-3">Your Review</h3>
            <div className="w-full min-h-30 p-4 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/50 text-sm font-serif italic text-[#5C613E]/70 flex items-center justify-center">
              [Text area: Private review or summary...]
            </div>
          </section>

          {/* JOURNEYS PLACEHOLDER */}
          <section>
            <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] mb-3">Reading Journeys</h3>
            <div className="w-full p-6 border-2 border-dashed border-[#E5E0D8] rounded-md bg-white/50 text-sm font-sans text-[#5C613E]/70 flex flex-col items-center justify-center">
              <span className="text-2xl opacity-30 mb-2">⏳</span>
              <span>[Timeline: Started reading on X, Finished on Y]</span>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}