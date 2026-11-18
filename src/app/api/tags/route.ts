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

export async function POST() {
  // Code to be added
}

export async function DELETE() {
  // Code to be added
}

// We don't want to rely on DELETE only for renaming tags. Without the PATCH route, a user would have to delete the 
// tag they wish to rename, which would sever all ties to bookshelf items, re-create it with the new name, and then
// re-assign all bookshelf items. Really, really bad UX
export async function PATCH() {
  // Code to be added
}