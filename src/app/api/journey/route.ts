import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// Used to update current_page of a user Reading Joruney
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { bookshelf_item_id, current_page } = body;

    if (!bookshelf_item_id || current_page === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const query = {
      name: 'update-active-journey-progress',
      // First time EXISTS is used in the codebase! It acts as an inline security check here to ensure this user actually owns the bookshelf 
      // item. It's especially important to do these types of checks when using UPDATE. "But we have other UPDATE clauses in the codebase?"
      // Yes. But in these other cases we're looking at *direct ownership*. Here, in the case of updating current_page of the Reading Journey,
      // we're looking at *inherited ownership*. Reading_Journey doesn't have `user_id` in it. It inherits it from the Bookshelf_Item table!
      // This is where EXISTS truly gets to shine. 
      // The query below *could* also be written using JS surrounding this query. But it would require two queries! If possible, we wanna 
      // condense everything into one cohesive query to keep the "trips to the database" as few as possible!
      // Also this line `AND finished_at IS NULL` ensures it's the active iteration
      text: `
        UPDATE "Reading_Journey"
        SET current_page = $1
        WHERE bookshelf_item_id = $2 
          AND finished_at IS NULL
          AND EXISTS (
            SELECT 1 
            FROM "Bookshelf_Item" bi 
            WHERE bi.id = "Reading_Journey".bookshelf_item_id 
              AND bi.user_id = $3
          )
        RETURNING id, current_page;
      `,
      values: [current_page, bookshelf_item_id, user.id]
    };

    const res = await pool.query(query);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'No active reading journey found for this book' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated.',
      data: res.rows[0]
    });

  } catch (error) {
    console.error('Error updating journey progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};