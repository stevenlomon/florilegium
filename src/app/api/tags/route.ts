import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// Full Tag CRUD
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = {
      name: 'get-user-tags',
      text: `
        SELECT id, name, created_at
        FROM "Tag"
        WHERE user_id = $1
        ORDER BY name ASC
      `,
      values: [user.id]
    };

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows
    });

  } catch (error) {
    console.error("Unexpected error fetching tags:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    if (trimmedName.length > 50) {
      return NextResponse.json({ error: "Tag name cannot exceed 50 characters" }, { status: 400 });
    }

    const query = {
      name: 'create-user-tag',
      text: `
        INSERT INTO "Tag" (user_id, name)
        VALUES ($1, $2)
        ON CONFLICT (user_id, name) DO NOTHING -- Looks a bit strange but this is to work with the UNIQUE constraint and to allow for the 409 error below rather than a unhelpful and generic 500 error
        RETURNING *
      `,
      values: [user.id, trimmedName]
    };

    const res = await pool.query(query);

    // The name conflict UNIQUE constraint is handled by the server and the Frontend shows a user friendly message in response to the 409
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }

    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (error) {
    console.error("Unexpected error creating tag:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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
      name: 'detach-tag-from-bookshelf-item',
      text: `
        DELETE FROM "Bookshelf_Item_Tag"
        WHERE bookshelf_item_id = $1 AND tag_id = $2
        AND EXISTS ( -- Check ownership: a tag to be deleted must belong to the user in question and be attached to a matching bookshelf item by bookshelf_item_id
          SELECT 1 FROM "Bookshelf_Item" WHERE id = $1 AND user_id = $3
        )
        RETURNING *
      `,
      values: [bookshelf_item_id, tag_id, user.id]
    };

    const res = await pool.query(query);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Tag association not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: "ok" });

  } catch (error) {
    console.error("Unexpected error detaching tag:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
}

// We don't want to rely on DELETE only for renaming tags. Without the PATCH route, a user would have to delete the 
// tag they wish to rename, which would sever all ties to bookshelf items, re-create it with the new name, and then
// re-assign all bookshelf items. Really, really bad UX
export async function PATCH(req: Request) {
  // Code to be added
}