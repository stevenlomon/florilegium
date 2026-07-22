import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// The Horizon now gets its own dedicated Server Side fetch file, just like Bookshelf and Reading Tracks. The query is completely untouched!
export async function getHorizonBooks() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const query = {
      name: 'get-user-bookshelf-for-horizon', // Specific Horizon fetch query for now. We'll build it out with dynamic parameters later as needed
      // The query itself is a chonky one, slightly overwhelming to look at haha! But we need a JOIN cuz we need data from both the
      // Bookshelf_Item and the Book table. They're joined on book_id (id in the Book table). This is Database 101 coming back haha
      // `WHERE bi.user_id = $1` This is a crucial line to ensure we only return results for the user in question
      // `AND bi.status_id IN (1, 2)` This is specific to only this Horizon fetch query
      // `ORDER BY bi.added_at DESC` Golden rule of backend engineering: Leverage the power of the database! Always let Postgres do sorting and 
      // filtering. It is written in ultra-optimized C. But speed is not the main reason we always let the database do these tasks; JS is pretty
      // fast too and sometimes even faster in smaller datasets. If we have a large dataset of say 10,000 rows and we let JS do it with some .sort()
      // somewhere in our code; the Postgres rows would be serialized into JSON and then our Next.js would need to hold a massive multi-megabyte
      // payload across the network and load all 10,000 rows into its RAM. We would suffocate the network pipe haha!
      // UPDATE: Speaking of ultra-optimized C haha; now we have Postgres do C-level filtering to ensure horizon_slot is not null before it
      // hands us the payload! I noticed that we get a bunch of books in the User Bookshelf where horizon slot is null when doing this fetch
      // which is really unnecessary!
      // UPDATE: The cause of the "clicking Horizon books crashes the app".. is that we're not grabbing the external Open Library ID from the db!
      text: `
        SELECT 
          bi.id AS bookshelf_item_id, 
          bi.status_id, 
          bi.horizon_slot,
          b.id AS book_id, 
          b.external_id, -- Added!
          b.title, 
          b.author, 
          b.cover_image_url, 
          b.page_count
        FROM "Bookshelf_Item" bi
        JOIN "Book" b ON bi.book_id = b.id
        WHERE bi.user_id = $1 
          AND bi.status_id IN (1, 2) 
          AND bi.horizon_slot IS NOT NULL
        ORDER BY bi.added_at DESC
      `,
      values: [user.id]
    };

  const res = await pool.query(query);
  return res.rows;
};