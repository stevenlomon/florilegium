'use client';
// The interactive Client-Side part of the Search Result Page broken out as a Client Component to be imported and integrated with the Server Component!

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SearchResultsGridProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchResults: any[];
}

export default function SearchResultsGrid({ searchResults }: SearchResultsGridProps) {
  const [failedImages, setFailedImages] = useState<string[]>([]);

  // Count how many works in the *current* batch had a cover to begin with
  const totalWithCovers = searchResults.filter((w) => w.cover_i).length;
  
  // Count how many of the *current* batch have failed
  const currentFailures = searchResults.filter((w) => {
    const workId = w.key.replace('/works/', '');
    return failedImages.includes(workId);
  }).length;

  // If every single cover in this batch failed, the CDN is definitely down
  const isCdnDown = totalWithCovers > 0 && currentFailures === totalWithCovers;

  return (
    <>
      {isCdnDown && (
        <div className="mb-8 p-4 bg-[#8C3A3A]/5 border border-[#8C3A3A]/20 rounded-md flex items-center justify-center animate-in fade-in duration-500">
          <p className="text-sm font-serif italic text-[#8C3A3A]/80 text-center">
            It seems there is a temporary hiccup on Open Library&apos;s image servers. Book covers may be unavailable, but the archives are fully explorable.
          </p>
        </div>
      )}
      
      <ul className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-0 m-0 list-none">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {searchResults.map((work: any) => {
          // Same Defensive Data Parsing. The need for this Client just proves it even strong: Open Library data is unfortunately extremely messy haha
          const title = work.title;
          const author = work.author_name ? work.author_name[0] : 'Unknown Author';
          const firstPublishYear = work.first_publish_year || 'Unknown Year';
          // Open Library keys look like "/works/OL12345W". We strip the prefix for our own routing
          const workId = work.key.replace('/works/', '');
          const hasFailed = failedImages.includes(workId);

          return (
            <Link key={work.key} href={`/book/${workId}`} className="group flex flex-col h-full">
              {/* Cover Image Container */}
              <div className="relative aspect-2/3 mb-3 border border-[#E5E0D8] rounded-md overflow-hidden bg-[#EFEBE1]/50 group-hover:border-[#5C613E]/50 group-hover:shadow-md transition-all duration-300">
                {work.cover_i && !hasFailed ? (
                  <Image
                    src={`https://covers.openlibrary.org/b/id/${work.cover_i}-M.jpg`}
                    alt={`Cover of ${title}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={() => setFailedImages((prev) => [...prev, workId])} // onError is a native property of `Image`!
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <span className="font-heading text-[#2C302E] text-sm line-clamp-3">{title}</span>
                  </div>
                )}
              </div>
              
              {/* Metadata */}
              <div className="flex flex-col grow">
                <h3 className="font-heading text-base text-[#2C302E] leading-tight mb-1 group-hover:text-[#5C613E] transition-colors line-clamp-2">
                  {title}
                </h3>
                <p className="font-sans text-xs text-[#5C613E] mb-1 line-clamp-1">{author}</p>
                <p className="font-serif italic text-[10px] text-[#5C613E]/70 mt-auto">{firstPublishYear}</p>
              </div>
            </Link>
          );
        })}
      </ul>
    </>
  )
};