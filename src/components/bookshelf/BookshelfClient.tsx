'use client'

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BookDetailsModal from './BookDetailsModal';

export interface BookshelfItem {
  bookshelf_item_id: string;
  status_id: number;
  user_rating: number | null;
  book_id: string;
  external_id: string | null;
  title: string;
  author: string;
  cover_image_url: string | null;
}

interface BookshelfClientProps {
  initialBooks: BookshelfItem[];
}

const TABS = [
  { id: 'all', label: 'All Books' },
  { id: '1', label: 'Intend to Read' },
  { id: '2', label: 'Currently Reading' },
  { id: '3', label: 'Read' },
  { id: '4', label: 'Dropped' }
];

export default function BookshelfClient({ initialBooks }: BookshelfClientProps) {
  const [books, setBooks] = useState<BookshelfItem[]>(initialBooks); // The master client-side state
  const [activeTab, setActiveTab] = useState('all'); // Defaults to 'all', is set to '1', '2', '3', or '4' by the Filtering button onClick
  const [selectedBook, setSelectedBook] = useState<BookshelfItem | null>(null); // New state for the modal!

  // Filter books based on the active tab. What is ultimately rendered in the return render statement is not `books`, but this filtered
  // `filteredBooks` array!
  const filteredBooks = books.filter(book => {
    // The array `.filter()` method takes a boolean condition to do the filtering. Everything that *satisfies* the condition is let 
    // through by the "gateway filter" condition. If activeTab is 'all', we let the gateway condition be `true`, a condition that *always*
    // evaluates to.. `true` haha! *All* elements of the array are let through meaning `filteredBooks` is a perfect copy of `books`
    if (activeTab === 'all') return true;

    // But only if activeTab is 'all'! Otherwise, we use the more intuitive "gateway filter" condition
    return book.status_id.toString() === activeTab;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E0D8] pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} // The crucial and essential onClick!
            className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${activeTab === tab.id
                ? 'bg-[#424B2E] text-white shadow-sm'
                : 'bg-white/50 text-[#5C613E] hover:bg-[#EFEBE1]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {filteredBooks.map((book) => (
          <div
            key={book.bookshelf_item_id}
            className="flex flex-col gap-3 group cursor-pointer"
            onClick={() => setSelectedBook(book)}
          >
            {/* Cover */}
            <div className="relative aspect-2/3 rounded-md overflow-hidden border border-[#E5E0D8] hover:border-[#5C613E] hover:shadow-lg transition-all shadow-sm bg-[#FCF9F2]">
              {book.cover_image_url ? (
                <Image
                  src={book.cover_image_url}
                  alt={`Cover of ${book.title}`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#EFEBE1]/50">
                  <h3 className="font-heading text-lg text-[#2C302E] leading-tight line-clamp-3 mb-2">{book.title}</h3>
                  <p className="font-sans text-xs text-[#5C613E] line-clamp-2">{book.author}</p>
                </div>
              )}

              {/* Optional: Future home of the recommendation badge or rating stars */}
              {book.status_id === 3 && book.user_rating && (
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm flex items-center gap-1">
                  <span className="text-[10px] font-bold text-[#424B2E]">★ {book.user_rating}</span>
                </div>
              )}
            </div>

            {/* Metadata underneath */}
            <div>
              <h3 className="font-heading text-base text-[#2C302E] leading-tight line-clamp-1 group-hover:text-[#424B2E] transition-colors">
                {book.title}
              </h3>
              <p className="font-sans text-[11px] text-[#5C613E] mt-1 line-clamp-1">
                {book.author}
              </p>
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-70">
            <span className="text-4xl mb-4">🌿</span>
            <p className="text-[#5C613E] font-serif italic">No books found in this section.</p>
          </div>
        )}
      </div>

    {/* The new modal at the very end of the return render statement */}
      <BookDetailsModal
        isOpen={!!selectedBook} // Only open if there IS selectedBook. The double `!!`, called "Double Bang" is essentially a neat shorthand in this scenario of writing `isOpen={selectedBook !== null ? true : false}`
        onClose={() => setSelectedBook(null)}
        book={selectedBook}
      />
    </div>
  );
}