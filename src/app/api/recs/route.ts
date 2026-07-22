import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// This is where Route Handlers altering the Recommendation Context Row table will live. 
// Full CRUD; they're gonna be able to add rows, edit them and delete them!
// The only piece of user-given data that is non-nullable is recommended_by. link and notes are both nullable
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookshelf_item_id, recommended_by, link=null, notes=null } = body; 

    if (!bookshelf_item_id || !recommended_by) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Input data validation
    const trimmedRecommendedBy = recommended_by.trim();
    if (trimmedRecommendedBy.length < 3) {
      return NextResponse.json({ error: "Recommended-by cannot be less than 3 characters" }, { status: 400 });
    }

    if (link) {
      const trimmedLink = link.trim();
      if (!trimmedLink) {
        return NextResponse.json({ error: "Link cannot be empty" }, { status: 400 });
      }
    }

    if (notes) {
      const trimmedNotes = notes.trim();
      if (!trimmedNotes) {
        return NextResponse.json({ error: "Notes cannot be empty" }, { status: 400 });
      }
    }

    const newRowId = crypto.randomUUID();

    const query = {
      name: 'insert-recommendation-context-row',
      text: `
        INSERT INTO "Recommendation_Context_Row" (id, bookshelf_item_id, recommended_by, link, notes) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *
      `,
      values: [newRowId, bookshelf_item_id, recommended_by, link, notes]
    };

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (err) {
    console.error("Unexpected error saving recommendation context row:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};

// The PATCH methods that enables edits via the UI!
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, recommended_by, link, notes } = body;

    if (!id || !recommended_by) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trimmedRecommendedBy = recommended_by.trim();
    if (trimmedRecommendedBy.length < 3) {
      return NextResponse.json({ error: "Recommended-by cannot be less than 3 characters" }, { status: 400 });
    }

    const query = {
      name: 'update-recommendation-context-row',
      // We use EXISTS to guarantee this recommendation belongs to a Bookshelf Item owned by the current user. Same trick used in 
      // the Reading Journey PATCH and the check to see if a book already exists in a user's bookshelf!
      text: `
        UPDATE "Recommendation_Context_Row" 
        SET recommended_by = $1, link = $2, notes = $3 
        WHERE id = $4 
        AND EXISTS (
          SELECT 1 FROM "Bookshelf_Item" bi 
          WHERE bi.id = "Recommendation_Context_Row".bookshelf_item_id 
          AND bi.user_id = $5
        )
        RETURNING *
      `,
      values: [
        trimmedRecommendedBy, 
        link ? link.trim() : null, 
        notes ? notes.trim() : null, 
        id, 
        user.id
      ]
    };

    const res = await pool.query(query);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Recommendation not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (err) {
    console.error("Unexpected error updating recommendation context row:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};