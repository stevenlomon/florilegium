'use client';

import { useState } from 'react';
import { SUMMARY_CHARACTER_LIMIT as CHARACTER_LIMIT } from '@/lib/constants';

export default function ExpandableSummary({ text }: { text: string | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) {
    return (
      <p className="font-serif text-[#2C302E] leading-relaxed">
        No summary available for this work.
      </p>
    );
  }

  const cleanedText = text
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();

  const needsExpansion = cleanedText.length > CHARACTER_LIMIT;
  
  // If it's expanded or doesn't need expansion, show full text.
  // Otherwise, slice it to the limit and append an ellipsis.
  const displayText = isExpanded || !needsExpansion
    ? cleanedText
    : cleanedText.slice(0, CHARACTER_LIMIT) + '...';

  return (
    // break-words fixes the URL spillover. 
    // whitespace-pre-wrap respects any natural paragraph breaks from the API.
    <div className="font-serif text-[#2C302E] leading-relaxed wrap-break-word whitespace-pre-wrap">
      {displayText}
      
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C613E] hover:text-[#424B2E] transition-colors inline-block"
        >
          {isExpanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}