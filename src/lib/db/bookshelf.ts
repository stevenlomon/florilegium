import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';
import { type BookshelfItem } from '../types';

export async function getDetailedBookshelf(): Promise<BookshelfItem[]> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // In order for the initial fetch to also include recommendation rows, the query has grown. Oh boy has it grown haha. This is the most 
  // intimidating SQL query I've seen in my 3 years of programming. I have never seen COALESCE before. And I have taken "Advanced SQL" 
  // courses on LinkedIn learning haha! 
  // It's Saturday as of writing this and I am imposing a hard rule on myself to create some distance with the codebase in order to let it 
  // all marinate; no more new features until I understand this SQL query. And I will sit down with the intent to do that now on Monday. I 
  // am making it a conscious point to not rack up a mountain of technical debt. I want to be a developer and engineer of integrity.
  // Til Monday, there will only be polishing of the features that are already implemented and UX polishes. Maintaining! To get familiar with
  // the codebase that has *already* grown a bit faster than I can wrap my mind around.
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
        b.cover_image_url,
        COALESCE(
          json_agg(
            json_build_object(
              'id', rcr.id,
              'bookshelf_item_id', rcr.bookshelf_item_id,
              'recommended_by', rcr.recommended_by,
              'link', rcr.link,
              'notes', rcr.notes
            )
          ) FILTER (WHERE rcr.id IS NOT NULL),
          '[]'
        ) AS recommendation_contexts
      FROM "Bookshelf_Item" bi
      JOIN "Book" b ON bi.book_id = b.id
      LEFT JOIN "Recommendation_Context_Row" rcr ON bi.id = rcr.bookshelf_item_id
      WHERE bi.user_id = $1
      GROUP BY bi.id, b.id
      ORDER BY bi.added_at DESC
    `,
    values: [user.id]
  };

  const res = await pool.query(query);
  const initialBooks = res.rows;

  return initialBooks;
};