import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { track_id, slot_id } = body;

    if (!track_id || !slot_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // // First, we get the actual db UUID of the track based on the numeric ID
    // // Temporary fix mirroring the assignment route, will tend to properly when implementing full CRUD for Reading Tracks
    // let dbTrackName = '';
    // if (track_id === 1) dbTrackName = 'Fiction';
    // if (track_id === 2) dbTrackName = 'Non-fiction';
    // if (track_id === 3) dbTrackName = 'Before Bedtime';
    // Now is the time to directly query by ID, gracefully dropping the hardcoded strings
    const trackRes = await pool.query(
      'SELECT id FROM "Reading_Track" WHERE user_id = $1 AND id = $2',
      [user.id, track_id]
    );

    if (trackRes.rowCount === 0) {
      return NextResponse.json({ error: `Reading track not found for user.` }, { status: 404 });
    }
    const realTrackId = trackRes.rows[0].id;

    if (slot_id === 2) {
      // Building out the unassignment for slot 2 since it's 10x simpler and less complex. It's not multi-step at all; we simply clear the 
      // follow_up_book_id on the Reading_Track table. The Bookshelf_Item is completely untouched and remains Intend to Read.
      const query = {
        name: 'unassign-follow-up-book',
        // In a sea of monster queries... simple by-the-book queries like these are so welcome haha
        text: `
          UPDATE "Reading_Track" 
          SET follow_up_book_id = NULL 
          WHERE id = $1 AND user_id = $2
          RETURNING *
        `,
        values: [realTrackId, user.id] // user.id as inline security check!
      };

      await pool.query(query);

      return NextResponse.json({ success: "ok" });
    }

    // The more complicated Crossroads Modal transaction for Slot 1: Now updated to align with Ma (間)! No more assembly line rushing. Issue #94
    if (slot_id === 1) {
      const { target_status_id, stepping_away_notes } = body;

      // For this MVP version, the user is asked if they want to put it back as "Intend to Read" (1) or "Dropped" (4)
      // Post MVP, I want to integrate a choice in User Settings to set a default so that they don't have to choose every time
      if (!target_status_id || (target_status_id !== 1 && target_status_id !== 4)) {
        return NextResponse.json({ error: "Valid target_status_id (1 or 4) is required for Slot 1" }, { status: 400 });
      }

      // Once again we grab a dedicated client from the pool for the transaction
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // // 1. Find the active Reading Journey AND the Follow-up book attached to this track (for auto-promotion of Follow-up Book if it exists)
        // const trackCheck = await client.query(
        //   'SELECT reading_journey_id, follow_up_book_id FROM "Reading_Track" WHERE id = $1 AND user_id = $2',
        //   [realTrackId, user.id]
        // );

        // const track = trackCheck.rows[0];
        // const journeyId = track?.reading_journey_id;

        // if (!journeyId) {
        //   throw new Error("No active reading journey found on this track.");
        // }

        // New 1. Find the active Reading Journey only. No follow_up_book_id. We're not doing doing auto-promotion anymore
        const trackCheck = await client.query(
          'SELECT reading_journey_id FROM "Reading_Track" WHERE id = $1 AND user_id = $2',
          [realTrackId, user.id]
        );
        const track = trackCheck.rows[0];
        const journeyId = track?.reading_journey_id;

        if (!journeyId) {
          throw new Error("No active reading journey found on this track.");
        }

        // 2. Identify the Bookshelf Item attached to this Journey
        const journeyCheck = await client.query(
          'SELECT bookshelf_item_id, current_page FROM "Reading_Journey" WHERE id = $1',
          [journeyId]
        );

        const bookshelfItemId = journeyCheck.rows[0].bookshelf_item_id;
        const currentPage = journeyCheck.rows[0].current_page; // We grab current_page now too so that...

        // // 3. Close the Reading Journey (Freeze the progress in time)
        // await client.query(
        //   'UPDATE "Reading_Journey" SET finished_at = NOW() WHERE id = $1',
        //   [journeyId]
        // );

        // New 3. Close the Reading Journey ONLY if the user marked it as "Dropped" (4).
        // If they shelved it (1), we leave finished_at AS NULL so that they can pick up where they left later!
        // Just like I'm doing now, putting Goblet of Fire on halt at page 325 to read Piranesi and then come 
        // back to Goblet of Fire with newfound awe and appreciation!
        if (target_status_id === 4) {
          await client.query(
            'UPDATE "Reading_Journey" SET finished_at = NOW() WHERE id = $1',
            [journeyId]
          );
        } else if (target_status_id === 1 && currentPage === 0 && !stepping_away_notes) {
          await client.query('DELETE FROM "Reading_Log_Post" WHERE reading_journey_id = $1', [journeyId]);
          await client.query('DELETE FROM "Reading_Journey" WHERE id = $1', [journeyId]);
        }

        if (stepping_away_notes) {
          const logId = crypto.randomUUID();
          await client.query(
            'INSERT INTO "Reading_Log_Post" (id, user_id, reading_journey_id, notes) VALUES ($1, $2, $3, $4)',
            [logId, user.id, journeyId, stepping_away_notes]
          );
        }

        // 4. Update the Bookshelf Item Status (1 = Intend to Read, 4 = Dropped)
        // If dropped, also clear the Horizon slot so the data is truthful!
        await client.query(
          `UPDATE "Bookshelf_Item" SET status_id = $1${target_status_id === 4 ? ', horizon_slot = NULL' : ''} WHERE id = $2 AND user_id = $3`,
          [target_status_id, bookshelfItemId, user.id]
        );

        // // 5. Check for Follow-up and Promote (or Empty)
        // if (track.follow_up_book_id) {
        //   // Promote it!! 🌿 Mark it as 2:"Currently Reading"
        //   await client.query(
        //     'UPDATE "Bookshelf_Item" SET status_id = 2 WHERE id = $1 AND user_id = $2',
        //     [track.follow_up_book_id, user.id]
        //   );

        //   // Calculate the iteration for the book that is to be promoted
        //   const iterRes = await client.query(
        //     'SELECT COUNT(*) FROM "Reading_Journey" WHERE bookshelf_item_id = $1',
        //     [track.follow_up_book_id]
        //   );
        //   const nextIteration = parseInt(iterRes.rows[0].count, 10) + 1;

        //   // Create a brand new Reading Journey
        //   const newJourneyId = crypto.randomUUID();
        //   await client.query(
        //     'INSERT INTO "Reading_Journey" (id, current_page, bookshelf_item_id, iteration) VALUES ($1, 0, $2, $3)',
        //     [newJourneyId, track.follow_up_book_id, nextIteration]
        //   );

        //   // Promote it and update the track! Slot the new journey in, and empty out the follow-up slot 🌿
        //   await client.query(
        //     'UPDATE "Reading_Track" SET reading_journey_id = $1, follow_up_book_id = NULL WHERE id = $2',
        //     [newJourneyId, realTrackId]
        //   );
        // } else {
        //   // If there is no Follow-up book, just empty the Currently Reading slot normally
        //   await client.query(
        //     'UPDATE "Reading_Track" SET reading_journey_id = NULL WHERE id = $1',
        //     [realTrackId]
        //   );
        // }

        // New 5. Simply empty the Currently Reading slot. No auto-promotion. No assembly line. Just Ma (間)
        await client.query(
          'UPDATE "Reading_Track" SET reading_journey_id = NULL WHERE id = $1',
          [realTrackId]
        );

        await client.query('COMMIT');
        return NextResponse.json({ success: "ok" });

      } catch (dbError) {
        await client.query('ROLLBACK');
        console.error("Slot 1 Unassign Transaction Failed:", dbError);
        throw dbError;
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ error: "Invalid slot_id" }, { status: 400 });

  } catch (err) {
    console.error("Unexpected error in reading track unassignment:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};