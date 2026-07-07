// For inserting and updating items onto the user's Bookshelf. Affects the Bookshelf_Item table
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();

    // The server provides all data except added_at that Postgres can automatically generate
    // When creating and inserting a bookshelf item, we omit horizon_slot, peak_slot and user_rating; these are updated in a separate fetch
    const itemId = crypto.randomUUID();

    const query = {
      name: 'insert-user-bookshelf-item',
      text: 'INSERT INTO "Bookshelf_Item"(id, user_id, book_id, status_id) VALUES($1, $2, $3, $4) RETURNING *',
      values: [itemId, user.id, body.book_id, body.status_id]
    }
    const res = await pool.query(query);
    const item = res.rows[0];
    console.log("Bookshelf item insertion results", item);

    return NextResponse.json({
      success: "ok",
      data: {
        id: item.id,
        user_id: item.user_id,
        book_id: item.book_id,
        status_id: item.status_id,
      }
    });
  } catch (err) {
    console.error("Unexpected error when trying to insert Bookshelf item", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};