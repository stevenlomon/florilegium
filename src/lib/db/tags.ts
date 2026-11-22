import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';
import { type Tag } from '../types';

// This is different from the tags expansion in bookshelf.ts. That gives us all the tags for a specific bookshelf item
// This fetches all tags belonging to a specific user. Will be needed for the auto-complete suggestions and for the 
// sixth-column filter on the bookshelf.
export async function getUserTags(): Promise<Tag[]> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // And unlike the three other files in this db folder, this query is super simple haha
  const query = {
    // name: 'get-user-tags-server',
    text: `
      SELECT id, name
      FROM "Tag"
      WHERE user_id = $1
      ORDER BY name ASC
    `,
    values: [user.id]
  };

  const res = await pool.query(query);
  return res.rows;
}