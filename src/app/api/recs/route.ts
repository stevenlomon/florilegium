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
    if (!trimmedRecommendedBy) {
      return NextResponse.json({ error: "Recommended-by cannot be empty" }, { status: 400 });
    }

    if (link !== undefined) {
      const trimmedLink = link.trim();
      if (!trimmedLink) {
        return NextResponse.json({ error: "Link cannot be empty" }, { status: 400 });
      }
    }

    if (notes !== undefined) {
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