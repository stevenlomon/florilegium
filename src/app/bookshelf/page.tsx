import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';
import BookshelfClient from '@/components/bookshelf/BookshelfClient';

export default async function BookshelfPage() {
  // Since this is a server component, we can do this! Use what the brain consider's "Backend functions"... in a Frontend component haha!
  // This is truly where Next.js shines and shows that *there is no "backend" and no "frontend"; only full-stack!!
  // I will dive back into *why* we use the GET Route Handlers for the Horizon and Reading Tracks sections and this way here in a day or
  // two cuz right now it feels like my brain is about to implode and I wanna keep the flow momentum going hahaha
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch all books for the user's bookshelf
  const query = {
    name: 'get-user-bookshelf-all',
    text: `
      SELECT 
        bi.id AS bookshelf_item_id,
        bi.status_id,
        bi.user_rating,
        b.id AS book_id,
        b.external_id,
        b.title,
        b.author,
        b.cover_image_url
      FROM "Bookshelf_Item" bi
      JOIN "Book" b ON bi.book_id = b.id
      WHERE bi.user_id = $1
      ORDER BY bi.added_at DESC
    `,
    values: [user.id]
  };

  const res = await pool.query(query);
  const initialBooks = res.rows;

  return (
    <div className="max-w-350 mx-auto pt-8 xl:pt-16 px-4 xl:px-0">
      <div className="mb-10">
        <h1 className="text-4xl font-heading text-[#2C302E] mb-2">Your Bookshelf</h1>
        <p className="text-[#5C613E] font-serif italic text-lg">
          Your personal library and reading history.
        </p>
      </div>

      {/* Pass the server-fetched data straight into our interactive client component */}
      <BookshelfClient initialBooks={initialBooks} />
    </div>
  );
}