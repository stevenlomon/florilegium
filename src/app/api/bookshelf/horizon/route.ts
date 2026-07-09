import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET(_req: Request) { // We accept req just in case we need URL parameters later. `_req` and not `req` to signal to TS "I know I'm not using this variable but it will be used!"
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = {
      name: 'get-user-bookshelf-for-horizon', // Specific Horizon fetch query for now. We'll build it out with dynamic parameters later as needed
      // The query itself is a chonky one, slightly overwhelming to look at haha! But we need a JOIN cuz we need data from both the
      // Bookshelf_Item and the Book table. They're joined on book_id (id in the Book table). This is Database 101 coming back haha
      // `WHERE bi.user_id = $1` This is a crucial line to ensure we only return results for the user in question
      // `AND bi.status_id IN (1, 2)` This is specific to only this Horizon fetch query
      // `ORDER BY bi.added_at DESC` Golden rule of backend engineering: Leverage the power of the database! Always let Postgres that is written
      // in ultra-optimized C do sorting and filtering. It does it faster than any JavaScript we can possibly write haha
      text: `
        SELECT 
          bi.id AS bookshelf_item_id, 
          bi.status_id, 
          bi.horizon_slot,
          b.id AS book_id, 
          b.title, 
          b.author, 
          b.cover_image_url, 
          b.page_count
        FROM "Bookshelf_Item" bi
        JOIN "Book" b ON bi.book_id = b.id
        WHERE bi.user_id = $1 
          AND bi.status_id IN (1, 2) 
        ORDER BY bi.added_at DESC
      `,
      values: [user.id]
    };

    const res = await pool.query(query);
    const bookshelfItems = res.rows; // Not `res.rows[0];`! Muscle memory to break when consciously needed haha; here we actually want all the rows!
    console.log("Bookshelf items retrieved from user for Horizon fetch", bookshelfItems);

    return NextResponse.json({
      success: "ok",
      data: bookshelfItems // No need to make it an array of Book objects; this *is* the array! We simply return it haha!
    });
  } catch (err) {
    console.error("Unexpected error when trying to retrieve user Bookshelf", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};

// PATCH endpoint for assigning Horizon Book rather than PUT (we're altering one row rather than replacing the entire resource)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // We expect the frontend to send us these two exact pieces of data
    const { bookshelf_item_id, horizon_slot } = body;

    const query = {
      name: 'update-horizon-slot',
      text: `
        UPDATE "Bookshelf_Item" 
        SET horizon_slot = $1 
        WHERE id = $2 AND user_id = $3 
        RETURNING *
      `,
      values: [horizon_slot, bookshelf_item_id, user.id] // user.id protects the row!
    };

    const res = await pool.query(query);
    const updatedHorizonSlot = res.rows[0];

    // If rowCount is 0, it means the item didn't exist OR it didn't belong to this user
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
    }

    console.log(`Successfully assigned item ${bookshelf_item_id} to Slot ${horizon_slot}`, updatedHorizonSlot);

    return NextResponse.json({
      success: "ok",
      data: updatedHorizonSlot
    });
  } catch (err) {
    console.error("Unexpected error when trying to assign Horizon Book", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};