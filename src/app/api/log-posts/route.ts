import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// Used for now only to capture raw thoughts when finishing a book but will later also be used in conjunction with Reading Sessions!
// To make this possible, minutes_logged, intended_minutes, and pages_read are all nullable in the database. This allows the user to both
// capture their raw thoughts just after having finished a book but also 6 months down the line; all contained in the same Reading Journey
// before they start the next journey, the next iteration, with re-reads!
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reading_journey_id, notes, note_type, pages_read } = body;

    if (!reading_journey_id || !notes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Input data validation
    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      return NextResponse.json({ error: "Notes cannot be empty" }, { status: 400 });
    }

    const newLogId = crypto.randomUUID();

    const query = {
      name: 'insert-reading-log-post',
      text: `
        INSERT INTO "Reading_Log_Post" (id, user_id, reading_journey_id, notes, note_type, pages_read)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      values: [newLogId, user.id, reading_journey_id, trimmedNotes, note_type || 'general', pages_read ?? null]
    };

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (err) {
    console.error("Unexpected error saving log post:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
}