import { getBookById } from '@/lib/api';
import { checkBookInBookshelf } from '@/lib/db/bookshelf';
import { notFound } from 'next/navigation';
import BackButton from '@/components/detail-page/BackButton';
import BookDetailsClient from '@/components/detail-page/BookDetailsClient';

// This is now a pure Server Component that imports the interactive part of the page as a Client Component!
export default async function DetailedViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // const book = await getBookById(id);
  // Rather than trying to grab book directly, we're gonna do it systematically to ensure no full black error screen
  let book;
  try {
    book = await getBookById(id);
  } catch {
    // If there is an error in finding the book id or the user enters an invalid gibberish id, notFound intercepts the 
    // request and redirects them to our custom 404 page at not-found.tsx! Next.js keeps impressing me
    notFound();
  }

  // With the book fetched server side, we can now run this server side check to see if it's in the user's bookshelf or not
  // using our new Data Access Layer function! Which will be passed as a new prop to the client component
  const isAlreadyInBookshelf = await checkBookInBookshelf(id);

  // Fallback if the API returns nothing
  if (!book) {
    return (
      <main className="min-h-screen p-8 max-w-5xl mx-auto flex items-center justify-center">
        <p className="font-sans text-[#5C613E]">Work not found in the archives.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Still using this Client Component here! */}
      <BackButton />
      
      {/* But now instead of a massive render return statement with HTML and CSS, it's all outsourced to the BookDetailsClient Client Component!*/}
      <BookDetailsClient 
        book={book} 
        isAlreadyInBookshelf={isAlreadyInBookshelf} 
      />
    </main>
  )
};