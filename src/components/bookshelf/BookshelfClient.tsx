'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { type BookshelfItem } from '@/lib/types';
import BookDetailsModal from './BookDetailsModal';

interface BookshelfClientProps {
  initialBooks: BookshelfItem[];
}

const TABS = [
  { id: 'all', label: 'All Books' },
  { id: '1', label: 'Intend to Read' },
  { id: '2', label: 'Currently Reading' }, // "Since we don't allow the user to assign Currently Reading from the Bookshelf, there's no reason to show the filter! It's all managed from the Reading Tracks UI!" Fair. But it causes confusion and cognitive dissonance when the math doesn't add up. Plus! Past code ensures that users can't change its "Currently Reading" status from the Bookshelf UI. And even tho "Currently Reading" is now visible as a dynamic Filter Tab, we still can't change Read status to "Currently Reading" from a book in the Bookshelf that is currently not of that status!
  { id: '3', label: 'Read' },
  { id: '4', label: 'Dropped' }
];

// 3 distinct organic squish shapes
const WAX_SHAPES = [
  "rounded-[45%_55%_32%_68%_/_60%_35%_65%_40%]", // Heavy bottom-right squish
  "rounded-[61%_39%_55%_45%_/_42%_58%_42%_58%]", // Top-left flared
  "rounded-[38%_62%_63%_37%_/_41%_44%_56%_59%]", // Scalloped 5-lobe feel
] as const;

// 4 organic tilt angles
const WAX_ROTATIONS = [
  "-rotate-3",
  "rotate-4",
  "-rotate-6",
  "rotate-2",
] as const;

export default function BookshelfClient({ initialBooks }: BookshelfClientProps) {
  const [activeTab, setActiveTab] = useState('all'); // Defaults to 'all', is set to '1', '2', '3', or '4' by the Filtering button onClick
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null); // Updated to just store the Id and not the entire object. See why below

  // State for tracking Open Library image failures
  const [failedImages, setFailedImages] = useState<string[]>([]);

  // New state for the Bookshelf search
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // New state and refs for the Sticky Bar!
  // isSticky is what actually triggers a re-render to show/hide the bar; the slide in/out animation
  // I've never really been confident around useRef but seeing three in a cluster here, the way I understand 
  // them now is that they make things change in the background *WITHOUT* causing a re-render of the entire 
  // component every time. They're "silent". They persist across renders but updating them doesn't cause
  // a "repaint". In this specific Sticky Bar scenario, their values change *on every single scroll tick*!
  const [isSticky, setIsSticky] = useState(false);
  const [isPastBar, setIsPastBar] = useState(false);   // For smoother and gentle slide in/out animation, this state is now also needed
  const filterBarRef = useRef<HTMLDivElement>(null);   // Points to the invisible "sentinel" div in the render return statement. It marks where the bar naturally lives
  const lastScrollY = useRef(0);                       // Where the user was on the *previous* scroll tick, compared against the current position to determine direction
  const barPassedRef = useRef(false);                  // Has the user scrolled past the filter bar? We only care about scroll direction *after* they've gone past it. Mirrors `isPastBar`

  // Empty dependency array [] -> this runs once on mount, listens forever, cleans up on unmount
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY; // How far down the page the user has scrolled (in px). 0 = very top of the page
      const filterBar = filterBarRef.current; // Grab the actual DOM element the ref is attached to
      if (!filterBar) return; // Safety: if the ref isn't attached yet, bail

      // getBoundingClientRect() returns the element's position relative to the *viewport* (what's visible on screen).
      // Adding scrollY converts that to an absolute "distance from the top of the document". A stable number
      // regardless of where the user has scrolled.
      const barTop = filterBar.getBoundingClientRect().top + currentY;

      // Has the user scrolled past the filter bar?
      // In web coordinates, Y increases DOWNWARD. So currentY > barTop means the bar is now above the viewport.
      if (currentY > barTop) {
        if (!barPassedRef.current) {
          barPassedRef.current = true;
          setIsPastBar(true);
        }
      }

      // Is the user scrolling up or down?
      if (barPassedRef.current) {
        if (currentY < lastScrollY.current) {
          setIsSticky(true);  // Scrolling UP (position is decreasing) → reveal the floating bar
        } else {
          setIsSticky(false); // Scrolling DOWN (position is increasing) → hide it, they're diving deeper
        }
      }

      // Has the user scrolled all the way back to where the bar naturally lives?
      // The bar resets back in its natural document flow position.
      if (currentY <= barTop) {
        if (barPassedRef.current) {
          barPassedRef.current = false;
          setIsPastBar(false);
        }
        setIsSticky(false);
      }

      lastScrollY.current = currentY; // Snapshot this tick's position so the *next* tick can compare against it
    };

    // `passive: true` tells the Browser we won't call preventDefault() to optimize scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Important cleanup: remove the event listener when the component is destroyed
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // In order to have router.refresh() work properly as intended in the modal, it serves us more to *not* have `books` be a state variable!
  const books = initialBooks;

  // Derive the actual book object on the fly! When router.refresh() brings in new data, this automatically finds the fresh version
  // Essentially another change to have router.refresh() work properly as intended in the model haha!
  const selectedBook = books.find(b => b.bookshelf_item_id === selectedBookId) || null;

  // Filter books based on the active tab. What is ultimately rendered in the return render statement is not `books`, but this filtered
  // `filteredBooks` array!
  // UPDATE: Supercharged to work with the search bar now! The search is *completely client side*, we simply filter the data that we
  // have already fetched server side
  const filteredBooks = books.filter(book => {
    // // The array `.filter()` method takes a boolean condition to do the filtering. Everything that *satisfies* the condition is let 
    // // through by the "gateway filter" condition. If activeTab is 'all', we let the gateway condition be `true`, a condition that *always*
    // // evaluates to.. `true` haha! *All* elements of the array are let through meaning `filteredBooks` is a perfect copy of `books`
    // if (activeTab === 'all') return true;

    // // But only if activeTab is 'all'! Otherwise, we use the more intuitive "gateway filter" condition
    // return book.status_id.toString() === activeTab;

    // -- The new filter logic for the Bookshelf Search --
    // 1. Check the Tab Filter first; very much in line with what we already have in the code above
    if (activeTab !== 'all' && book.status_id.toString() !== activeTab) {
      return false;
    }

    // 2. Filter using the search term in the search bar
    if (localSearchTerm.trim() !== '') {
      const term = localSearchTerm.toLowerCase();

      // Top-level matches
      const matchTitle = book.title.toLowerCase().includes(term);
      const matchAuthor = book.author.toLowerCase().includes(term);
      const matchReview = book.review?.toLowerCase().includes(term);

      // Deep dive into Recommendation Contexts
      const matchRecs = book.recommendation_context.some(rec =>
        rec.recommended_by.toLowerCase().includes(term) ||
        rec.notes?.toLowerCase().includes(term)
      );

      // Deep dive into Reading Journeys (Raw Thoughts)
      const matchJourneys = book.journeys.some(j =>
        j.notes?.toLowerCase().includes(term)
      );

      // If it doesn't match ANY of our criteria, filter it out
      if (!matchTitle && !matchAuthor && !matchReview && !matchRecs && !matchJourneys) {
        return false;
      }
    }

    // If it passed both the tab check and the search check, keep it!
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* FILTER TABS & LOCAL SEARCH */}

      {/* THE "SENTINEL" DIV */}
      <div ref={filterBarRef} />

      {/* THE CONDITIONAL FILTER BAR */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-4 transition-transform duration-300 ease-out ${isPastBar ? `fixed top-16 right-0 left-0 md:left-72 z-40 bg-[#FCF9F2] border-b border-[#E5E0D8] px-8 py-4 shadow-sm ${isSticky ? 'translate-y-0' : '-translate-y-full'}` : 'border-b border-[#E5E0D8]'}`}>

        {/* The Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const count = tab.id === 'all'
              ? books.length
              : books.filter(b => b.status_id.toString() === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-sans transition-all ${activeTab === tab.id
                  ? 'bg-[#424B2E] text-white shadow-sm'
                  : 'bg-white/50 text-[#5C613E] hover:bg-[#EFEBE1]'
                  }`}
              >
                {tab.label} <span className="opacity-70 text-xs ml-1">({count})</span>
              </button>
            )
          })}
        </div>

        {/* The Deep Search Input */}
        <div className="relative w-full lg:w-96 shrink-0 group">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C613E] opacity-50 group-focus-within:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            placeholder="Search authors, recommendation context, notes.."
            className="w-full bg-white/50 border border-[#E5E0D8] rounded-md pl-10 pr-4 py-2 text-sm font-serif text-[#2C302E] placeholder:text-[#5C613E]/50 focus:outline-none focus:border-[#424B2E] focus:ring-1 focus:ring-[#424B2E] transition-all shadow-sm"
          />
          {localSearchTerm && (
            <button
              onClick={() => setLocalSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C613E]/50 hover:text-[#8C3A3A] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {filteredBooks.map((book, index) => { // Grab the index for the `priority` property in the Image component (to silence a warning, see below)

          // We now check if this specific book cover has failed
          const hasFailed = failedImages.includes(book.bookshelf_item_id);

          return (
            <div
              key={book.bookshelf_item_id}
              className="flex flex-col gap-3 group cursor-pointer"
              onClick={() => setSelectedBookId(book.bookshelf_item_id)} // Now takes the Id, not the entire object
            >
              {/* Cover */}
              <div className="relative aspect-2/3 rounded-md overflow-hidden border border-[#E5E0D8] hover:border-[#5C613E] hover:shadow-lg transition-all shadow-sm bg-[#FCF9F2]">

                {/* NEW: The Florilegium Wax Seal */}
                {book.horizon_slot && (() => {
                  // Use modulo to cycle through shapes & rotations predictably based on slot number
                  const slotIndex = book.horizon_slot - 1;
                  const shapeClass = WAX_SHAPES[slotIndex % WAX_SHAPES.length];
                  const rotateClass = WAX_ROTATIONS[slotIndex % WAX_ROTATIONS.length];

                  return (
                    <div
                      className={`absolute top-2.5 left-2.5 w-[46px] h-[46px] z-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 origin-center ${rotateClass}`}
                      title="Horizon Masterpiece"
                    >
                      {/* 1. The Wax Base - Dynamic organic shape */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br from-[#9b2a2a] via-[#822424] to-[#521111] ${shapeClass} shadow-[2px_4px_8px_rgba(0,0,0,0.5),_inset_1.5px_1.5px_2px_rgba(255,255,255,0.3),_inset_-3px_-3px_6px_rgba(0,0,0,0.75)]`}
                      />

                      {/* 2. The Specular Sheen - Uses matching shapeClass so highlights line up */}
                      <div
                        className={`absolute inset-0 ${shapeClass} bg-gradient-to-b from-white/15 via-white/5 to-transparent mix-blend-overlay pointer-events-none`}
                      />

                      {/* 3. The Stamped Impression - Fixed circular core */}
                      <div className="absolute inset-[5px] rounded-full bg-gradient-to-br from-[#621616] via-[#7d2020] to-[#8d2424] border border-[#4a1010]/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),_inset_0_-1px_2px_rgba(255,255,255,0.25),_0_1px_2px_rgba(0,0,0,0.3)]" />

                      {/* 4. The Debossed Botanical Engraving (Mimicking the Olive Branch) */}
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        /* 
                          Key Changes for Debossing:
                          1. text-[#380b0b] sets the fill to a very deep, dark red (the shadowed depth of the wax).
                          2. drop-shadow-[0.5px_1px_0px_rgba(255,255,255,0.25)] acts as the light catching the bottom edge of the groove.
                          3. We removed the dark drop-shadow entirely, which prevents it from looking "raised".
                        */
                        className="absolute inset-0 w-full h-full scale-[0.68] text-[#380b0b] opacity-95 drop-shadow-[0.5px_1px_0px_rgba(255,255,255,0.25)]"
                      >
                        {/* Main converging stems */}
                        <path d="M12 21c0-4-1-7-3-10-1-1.5-2-2.5-4-4 1.5 0 3 1 4 2.5 1 1.5 2 4 2.5 6.5.5-2.5 1.5-5 2.5-6.5 1-1.5 2.5-2.5 4-2.5-2 1.5-3 2.5-4 4-2 3-3 6-3 10h-1z" />

                        {/* Left Branch Leaves */}
                        <path d="M8.5 15.5c-2-1-4-1-5 0 1 2 3 2 5 0z" />
                        <path d="M6.5 11.5c-2-.5-3.5-1.5-4-3 1.5.5 3 1.5 4 3z" />
                        <path d="M5.5 7.5c-1-1.5-1.5-3-1-4 1 1 1.5 2.5 1 4z" />

                        {/* Center Branch Leaves */}
                        <path d="M10.5 9.5c-1.5-1.5-2-3-1.5-4.5 1.5 1 2 2.5 1.5 4.5z" />
                        <path d="M13.5 9.5c1.5-1.5 2-3 1.5-4.5-1.5 1-2 2.5-1.5 4.5z" />

                        {/* Right Branch Leaves */}
                        <path d="M15.5 15.5c2-1 4-1 5 0-1 2-3 2-5 0z" />
                        <path d="M17.5 11.5c2-.5 3.5-1.5 4-3-1.5.5-3 1.5-4 3z" />
                        <path d="M18.5 7.5c1-1.5 1.5-3 1-4-1 1-1.5 2.5-1 4z" />

                        {/* Olive Berries */}
                        <circle cx="7" cy="13" r="1" />
                        <circle cx="10" cy="12" r="0.85" />
                        <circle cx="14" cy="12" r="0.85" />
                        <circle cx="17" cy="13" r="1" />
                        <circle cx="9" cy="7" r="0.9" />
                        <circle cx="15" cy="7" r="0.9" />
                        <circle cx="12" cy="5" r="1" />
                      </svg>
                    </div>
                  );
                })()}

                {/* UPDATED: Swap to the fallback if the image throws an error */}
                {book.cover_image_url && !hasFailed ? (
                  <Image
                    src={book.cover_image_url}
                    alt={`Cover of ${book.title}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    // priority={index < 10} // Tell Next.js to prioritize loading the first 10 covers! To silence "[browser] Image with src "https://covers.openlibrary.org/b/id/14566393-L.jpg" was detected as the Largest Contentful Paint (LCP). Please add the `loading="eager"` property if this image is above the fold." warning
                    loading={index < 10 ? "eager" : "lazy"}
                    fetchPriority={index < 10 ? "high" : "auto"} // These two lines replaces the one above them. `priority` has been deprecated!
                    onError={() => setFailedImages((prev) => [...prev, book.bookshelf_item_id])} // onError is a native property of `Image`!
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
          )
        })}

        {/* UPDATED ZERO RESULTS STATE */}
        {filteredBooks.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-70">
            <span className="text-4xl mb-4">🍂</span>
            {localSearchTerm ? (
              <p className="text-[#5C613E] font-serif italic text-lg">
                No notes, authors, or titles found matching &quot;{localSearchTerm}&quot;.
              </p>
            ) : (
              <p className="text-[#5C613E] font-serif italic text-lg">
                No books found in this section.
              </p>
            )}
          </div>
        )}
      </div>

      {/* The new modal at the very end of the return render statement */}
      <BookDetailsModal
        key={selectedBookId || 'empty-modal'} // To handle the edge case "What happens if a user opens broken cover Book A (setting `imageFailed` to `true`, closes it, and then opens good cover Book B?" In this scenario, `imageFailed` would still be `true`! When a `key` changes, React completely destroys the old component instance and builds a fresh one, wiping *all* stale state clean. 'empty-modal' is a completely arbitrary string
        isOpen={!!selectedBook} // Only open if there IS selectedBook. The double `!!`, called "Double Bang" is essentially a neat shorthand in this scenario of writing `isOpen={selectedBook !== null ? true : false}`
        onClose={() => setSelectedBookId(null)}
        book={selectedBook}
      />
    </div>
  )
};