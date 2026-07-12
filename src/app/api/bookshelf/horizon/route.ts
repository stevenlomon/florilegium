import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// Retired! And the query now lives in lib/db/horizon.ts!
// export async function GET(_req: Request) { // We accept req just in case we need URL parameters later. `_req` and not `req` to signal to TS "I know I'm not using this variable but it will be used!"
//   try {
//     const user = await getCurrentUser();
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const query = {
//       // Moved to lib/db/horizon.ts!
//     };

//     const res = await pool.query(query);
//     const bookshelfItems = res.rows; // Not `res.rows[0];`! Muscle memory to break when consciously needed haha; here we actually want all the rows!
//     console.log("Bookshelf items retrieved from user for Horizon fetch", bookshelfItems);

//     return NextResponse.json({
//       success: "ok",
//       data: bookshelfItems // No need to make it an array of Book objects; this *is* the array! We simply return it haha!
//     });
//   } catch (err) {
//     console.error("Unexpected error when trying to retrieve user Bookshelf", err);
//     return NextResponse.json({ success: "not ok" }, { status: 500 });
//   }
// };

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