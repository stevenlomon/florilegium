'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { type Edition } from '@/lib/types';

interface EditionSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  workId: string;
  onSelectEdition: (edition: Edition) => void;
  currentEditionId?: string | null;
}

// This is the first Client Component in our new shared folder because this will be shared by the Detailed View Page and the Bookshelf Item Details Modal!
// A user will be able to switch editions of a work before adding to Bookshelf *and* after adding to the Bookshelf
// Now fetches editions rather than being handed them as a prop. Instead it's handed a workId
export default function EditionSwitcherModal({ isOpen, onClose, workId, onSelectEdition, currentEditionId }: EditionSwitcherModalProps) {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect for the fetching this Client Component now needs to do..
  useEffect(() => {
    if (!isOpen) return;

    const fetchEditions = async () => {
      setIsLoading(true);
      try {
        // .. using our new API route!
        const res = await fetch(`/api/editions?workId=${workId}`);
        if (res.ok) {
          const json = await res.json();
          setEditions(json.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch editions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEditions();
  }, [isOpen, workId]);

  if (!isOpen) return null; // Early return guard clause

  // Fully vibe coded return render statement
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C302E]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#FCF9F2] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[85vh] border border-[#E5E0D8]">
        
        {/* HEADER */}
        <div className="px-8 pt-8 pb-4 border-b border-[#E5E0D8] bg-white relative flex justify-between items-start shrink-0">
          <div>
            <h2 className="font-heading text-2xl text-[#2C302E] tracking-wide mb-1">
              Select an Edition
            </h2>
            <p className="font-sans text-sm text-[#5C613E]">
              {isLoading 
                ? "Consulting the archives..." 
                : `Found ${editions.length} complete printings with verified cover scans and ISBN.`}
            </p>
          </div>
          <button onClick={onClose} disabled={isLoading} className="text-[#5C613E] hover:text-[#2C302E] p-2 transition-colors disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CONTENT GRID */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {isLoading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center">
               <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#E5E0D8] border-t-[#5C613E]"></div>
               <p className="mt-4 font-serif italic text-sm text-[#5C613E] animate-pulse">
                 Pulling physical printings from the catalog...
               </p>
            </div>
          ) : editions.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {editions.map((edition) => {
                const isSelected = edition.id === currentEditionId;

                return (
                  <button
                    key={edition.id}
                    onClick={() => onSelectEdition(edition)}
                    className="flex flex-col gap-3 group cursor-pointer text-left w-full"
                  >
                    {/* Cover Container */}
                    <div className={`relative aspect-2/3 rounded-md overflow-hidden border transition-all shadow-sm bg-[#EFEBE1] w-full
                      ${isSelected 
                        ? 'border-[#424B2E] ring-2 ring-[#424B2E] ring-offset-2 ring-offset-[#FCF9F2]' 
                        : 'border-[#E5E0D8] hover:border-[#5C613E] hover:shadow-md'
                      }`}
                    >
                      <Image
                        src={edition.cover_image_url as string}
                        alt={`Cover of ${edition.title}`}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />

                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#424B2E] text-[#FCF9F2] p-1 rounded-full shadow-sm z-10">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col gap-1">
                      <h3 className="font-heading text-base text-[#2C302E] leading-tight line-clamp-2 group-hover:text-[#424B2E] transition-colors">
                        {edition.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-[11px] font-sans text-[#5C613E]">
                        <span>
                          {edition.page_count ? `${edition.page_count} pages` : 'Length unknown'}
                        </span>
                        {edition.publish_date && (
                          <span className="font-serif italic text-[10px] text-[#5C613E]/70">
                            {edition.publish_date}
                          </span>
                        )}
                      </div>

                      {/* ISBN Tag */}
                      {edition.isbn && (
                        <span className="font-mono text-[9px] text-[#5C613E]/60 tracking-tighter truncate mt-0.5">
                          ISBN: {edition.isbn}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center opacity-70 h-full py-12">
              <span className="text-4xl mb-4">🍂</span>
              <p className="text-[#5C613E] font-serif text-lg">No alternative printings found with covers.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
};