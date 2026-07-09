import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';

// The Route Handler to be called when assigning a book, either from the User Bookshelf or Open Library, as their Currently Reading or Follow-up
// to one of their Reading Track. Now in Development, the Reading Tracks are hard coded as my three Reading Tracks, set in TRACKS in ReadinTracksSection.tsx
export async function POST(req: Request) {
  // This is by far the chonkiest Route Handler / endpoint I've ever written, Python included! An absolute unit of an endpoint
  // I will do my best to dissect it and break it down into first principles

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { trackId, slotId, bookshelf_item_id } = body;

    if (!trackId || !slotId || !bookshelf_item_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // We are going to do multiple database updates at the same time. We're updating three Tables with this one; Reading_Journey,
    // Reading_Track, and Bookshelf_Item. Because of this, we're going to use a Postgres *Transaction*. This is my first time hearing about 
    // them! "Do all three of these things, or do none of them." If step 1 and 2 succeed, but step 3 fails, the database automatically 
    // "rolls back" so that we don't end up with corrupted, half-finished data in our database.
    // And since we are about to do a DB Transaction, we can get a dedicated client from the pool to run it!
    const client = await pool.connect();

    try { // This might also be the first time I've seen a try/catch block within a try/catch block haha!
      // -- Start Transaction --
      await client.query('BEGIN');

      // First, we get the actual db UUID of the track based on the string ID (e.g., 'fiction')
      let dbTrackName = '';
      if (trackId === 'fiction') dbTrackName = 'Fiction';
      if (trackId === 'non-fiction') dbTrackName = 'Non-fiction';
      if (trackId === 'bedtime') dbTrackName = 'Before Bedtime';

      const trackRes = await client.query('SELECT id FROM "Reading_Track" WHERE user_id = $1 AND name = $2', [user.id, dbTrackName]);

      if (trackRes.rowCount === 0) {
        throw new Error(`Reading track '${dbTrackName}' not found for user.`);
      }

      const realTrackId = trackRes.rows[0].id;

      // Determine if we are assigning "Currently Reading" (1) or "Up Next" (2)
      const isCurrentlyReading = slotId === 1;

      // With the real Reading Track id and now knowing whether we are "Currently Reading" or now, we consider our two scenarios
      if (isCurrentlyReading) {
        // -- Scenario A: Currently Reading (Slot 1)

        // Update the reading status of the Bookshelf Item to Currently Reading (status_id = 2)
        await client.query('UPDATE "Bookshelf_Item" SET status_id = 2 WHERE id = $1 AND user_id = $2', [bookshelf_item_id, user.id]); // We can await a db query without assigning it to a variable! This is the first time this has properly clicked for me haha!

        // Check if an active Reading Journey exists for the User Bookshelf Item. We define "active" as finished_at IS NULL
        const journeyCheckRes = await client.query(
          'SELECT id FROM "Reading_Journey" WHERE bookshelf_item_id = $1 AND finished_at IS NULL',
          [bookshelf_item_id]
        );

        const checkedJourneyRows = journeyCheckRes.rowCount ?? 0; // "If rowCount is a number, use it. If it is null, treat it as 0."

        let activeJourneyId: string;

        if (checkedJourneyRows > 0) {
          // An active Reading Journey exists, grab its ID
          activeJourneyId = journeyCheckRes.rows[0].id;
        } else {
          // No active Reading Journey exists, we need look at previous history to determine the iteration
          const iterationRes = await client.query(
            'SELECT COUNT(*) FROM "Reading_Journey" WHERE bookshelf_item_id = $1',
            [bookshelf_item_id]
          );

          // From the amount of rows that correspongs to the Bookshelf Item, we get the iteration. If rows is 0, which null fallbacks to, it's
          // their first time reading the book. We add 1 and iteration is set to 1. If count is 1, it's their second time reading. We add 1 and 
          // iteration is instead set to 2. And whatever it's set to, we generate the new UUID for the row
          // COUNT(*) in Postgres aggregates and always returns exactly one row as a string. Like `[ { count: '0' } ]` or `[ { count: '5' } ]`.
          // We need to extract the string value from the `count` column and parse it
          const currentCount = parseInt(iterationRes.rows[0].count, 10);
          const nextIteration = currentCount + 1;
          const newJourneyId = crypto.randomUUID();

          await client.query(
            // started_at is taken care of by Postgres. current_page defaults to 0 when starting a new Reading Journey with the book
            `INSERT INTO "Reading_Journey" (id, current_page, bookshelf_item_id, iteration) 
            VALUES ($1, 0, $2, $3)`,
            [newJourneyId, bookshelf_item_id, nextIteration]
          );

          activeJourneyId = newJourneyId;
        }

        // Finally for this scenario, now with an active Journey Id, update the Reading Track to point to this journey
        await client.query('UPDATE "Reading_Track" SET reading_journey_id = $1 WHERE id = $2', [activeJourneyId, realTrackId]);
      } else {
        // -- Scenario B: Up Next (Slot 2) --

        // Update to ensure the Bookshelf Item is set to 'Want to Read' (status_id = 1)
        await client.query('UPDATE "Bookshelf_Item" SET status_id = 1 WHERE id = $1 AND user_id = $2', [bookshelf_item_id, user.id]);

        // Update the Reading Track to point to this book as the follow-up
        await client.query('UPDATE "Reading_Track" SET follow_up_book_id = $1 WHERE id = $2', [bookshelf_item_id, realTrackId]);
      }

      // -- Commit Transaction --
      // If we reach this point in the code, and if we reach this point in the code ONLY, we consider the transaction safe to commit!
      await client.query('COMMIT');

      return NextResponse.json({ success: "ok" }); // The most satisfying `success: "ok"` resopnse I'll ever return until this is topped haha!

    } catch (dbError) { // Specify the error
      // ROLLBACK on *any* error so that our database stays clean. Data integrity!
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      // Release the client back to the pool no matter the outcome
      client.release();
    }

  } catch (err) {
    console.error("Unexpected error in reading track assignment:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};