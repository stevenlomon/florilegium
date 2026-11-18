import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// This is the route handler to attach and remove tags from bookshelf items. Which is different from the tag CRUD route handler
export async function POST(req: Request) {
 try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookshelf_item_id, tag_id } = body;

    if (!bookshelf_item_id || !tag_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const query = {
      name: 'attach-tag-to-bookshelf-item',
      text: `
        INSERT INTO "Bookshelf_Item_Tag" (bookshelf_item_id, tag_id)

        -- Same "trick"/pattern used in other files for ownership but now for "dual ownership"! For a tag to be attached to a 
        -- bookshelf item, the bookshelf item need to belong to the user AND the tag needs to belong to the user
        SELECT $1, $2
        WHERE EXISTS (
          SELECT 1 FROM "Bookshelf_Item" WHERE id = $1 AND user_id = $3
        )
        AND EXISTS (
          SELECT 1 FROM "Tag" WHERE id = $2 AND user_id = $3
        )
        ON CONFLICT (bookshelf_item_id, tag_id) DO NOTHING
        RETURNING *
      `,
      values: [bookshelf_item_id, tag_id, user.id]
    };

    const res = await pool.query(query);

    // A generic "catch-all" 400 rather than a specific 409. We'll have the UI prevent double-attaching a tag to a bookshelf item
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Item or tag not found, unauthorized, or already attached" }, { status: 400 });
    }

    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (error) {
    console.error("Unexpected error attaching tag:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
 // Code to be added
}

