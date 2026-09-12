import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// This is intentionally placed differently than our assignment Route Handler. That's an *action*, it doesn't create or retrieve a resource.
// Therefore, it gets to live in /api/tracks/assign, while the two down below gets to live here in /api/tracks
// Only coding the essential GET Route Handler for now, the POST one to create custom Reading Tracks will be coded in the future. For now, 
// we'll use my three hard coded ones

// Archived! Retired! We don't use a GET Route Handler with a monster SQL query anymore, it lives in its own dedicated Data Access Layer file!
// export async function GET(_req: Request) {
//   try {
//     const user = await getCurrentUser();
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const query = {
//       name: 'get-user-reading-tracks',
//       // Also quite a chonky query. We're need JOIN cuz a simple 'SELECT * FROM "Reading_Track" WHERE user_id = $1' wouldn't
//       // return title, author and the cover_image_url! 
//       // And we glue together the two subqueries that use JOIN with a UNION ALL. Instead of adding data horizontally with more columns
//       // like JOIN, UNION ALL expands the dataset *vertically* by stacking them, adding more rows. It glues the two very differnt queries
//       // (the way that Currently Reading and Follow-up are stored are very different; one looks at Reading_Journey, the other looks at
//       // Bookshelf_Item) into a unified list. 
//       // Using UNION ALL instead of UNION saves us speed and performance. "Just blind-stack these rows. I don't care if there are duplicates" 
//       // Since we explicitly hardcoded 1 AS slot_id in the first query and 2 AS slot_id in the second query, it is mathematically impossible 
//       // for the rows to be duplicates.
//       // Update: Now also includes bookshelf_item_id which is needed from the Reading Tracks UI
//       // Update: Now also include custom_page_count and page_count for the real Progress Tracker
//       text: `
//         -- SLOT 1: Currently Reading (Linked via Reading_Journey)
//         SELECT 
//           LOWER(REPLACE(rt.name, ' ', '-')) AS track_id, -- Maps 'Before Bedtime' to 'before-bedtime'
//           1 AS slot_id,
//           b.id AS book_id,
//           b.external_id,
//           b.title,
//           b.author,
//           b.cover_image_url,
//           b.page_count,
//           bi.id AS bookshelf_item_id,
//           bi.custom_page_count
//         FROM "Reading_Track" rt
//         JOIN "Reading_Journey" rj ON rt.reading_journey_id = rj.id
//         JOIN "Bookshelf_Item" bi ON rj.bookshelf_item_id = bi.id
//         JOIN "Book" b ON bi.book_id = b.id
//         WHERE rt.user_id = $1

//         UNION ALL

//         -- SLOT 2: Follow-up (Linked directly via Bookshelf_Item)
//         SELECT 
//           LOWER(REPLACE(rt.name, ' ', '-')) AS track_id,
//           2 AS slot_id,
//           b.id AS book_id,
//           b.external_id,
//           b.title,
//           b.author,
//           b.cover_image_url,
//           b.page_count,
//           bi.id AS bookshelf_item_id,
//           bi.custom_page_count
//         FROM "Reading_Track" rt
//         JOIN "Bookshelf_Item" bi ON rt.follow_up_book_id = bi.id
//         JOIN "Book" b ON bi.book_id = b.id
//         WHERE rt.user_id = $1
//       `,
//       values: [user.id]
//     };

//     const res = await pool.query(query);

//     return NextResponse.json({
//       success: "ok",
//       data: res.rows
//     });
//   } catch (error) {
//     console.error("Error fetching reading tracks:", error);
//     return NextResponse.json({ success: "not ok" }, { status: 500 });
//   }
// };

// Reading Track creation now possible! But I'm doubling down on the constraint that a user can never have more than 3 tracks at any given time!
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Track name is required" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      // Guardrail: Ensure they don't exceed 3 tracks
      const countRes = await client.query('SELECT COUNT(*) FROM "Reading_Track" WHERE user_id = $1', [user.id]);
      if (parseInt(countRes.rows[0].count, 10) >= 3) {
        return NextResponse.json({ error: "Maximum of 3 Reading Tracks allowed." }, { status: 400 });
      }

      const query = {
        name: 'insert-reading-track',
        text: `
          INSERT INTO "Reading_Track" (user_id, name, description)
          VALUES ($1, $2, $3)
          RETURNING id, name AS title, description
        `,
        values: [user.id, name.trim(), description ? description.trim() : null]
      };

      const res = await client.query(query);

      return NextResponse.json({
        success: "ok",
        data: res.rows[0]
      });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Unexpected error creating reading track:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
};

// For editing the name or description of a Reading Track
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { track_id, name, description } = body;

    // We absolutely need the track_id to know which row to update
    if (!track_id) {
      return NextResponse.json({ error: "Missing required track_id" }, { status: 400 });
    }

    // Gatekeeper: Ensure they are actually trying to update something
    if (name === undefined && description === undefined) {
      return NextResponse.json({ error: "No valid fields provided for update" }, { status: 400 });
    }

    const query = {
      name: 'update-reading-track',
      // COALESCE is our best friend here! I've gone from being absolutely terrified of it to now seeing it as a friend haha!
      // If $1 (name) is null, it just overwrites the column with its own existing value.
      text: `
        UPDATE "Reading_Track"
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description)
        WHERE id = $3 AND user_id = $4
        RETURNING *
      `,
      // We pass undefined as null so COALESCE catches it properly
      values: [name ?? null, description ?? null, track_id, user.id]
    };

    const res = await pool.query(query);

    // If rowCount is 0, the track either doesn't exist or this user doesn't own it
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Reading track not found or unauthorized" }, { status: 404 });
    }

    console.log(`Successfully updated Reading Track ${track_id}`);
    
    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (error) {
    console.error("Unexpected error updating reading track:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
};

// A user can up to 2 of their 3 Reading Tracks but ONLY if the Reading Track currently has zero assigned books! This adds
// intentionality and ensures that there are no Reading Tracks with books assigned as Currently Reading and Follow-up being
// deleted by the grace of fat fingers
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { track_id } = body;

    if (!track_id) {
      return NextResponse.json({ error: "Missing required track_id" }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // First Guardrail: Ensure they aren't deleting their last track
      const countRes = await client.query('SELECT COUNT(*) FROM "Reading_Track" WHERE user_id = $1', [user.id]);
      if (parseInt(countRes.rows[0].count, 10) <= 1) {
        throw new Error("MinimumTracksReached");
      }

      // Second Guardrail: Ensure the track is completely empty!
      const trackRes = await client.query(
        'SELECT reading_journey_id, follow_up_book_id FROM "Reading_Track" WHERE id = $1 AND user_id = $2', 
        [track_id, user.id]
      );
      
      if (trackRes.rowCount === 0) {
        throw new Error("TrackNotFound");
      }

      const track = trackRes.rows[0];
      if (track.reading_journey_id !== null || track.follow_up_book_id !== null) {
        throw new Error("TrackNotEmpty");
      }

      // Execute the deletion (safe and simple with the two guardrails in place)
      await client.query('DELETE FROM "Reading_Track" WHERE id = $1 AND user_id = $2', [track_id, user.id]);

      await client.query('COMMIT');
      return NextResponse.json({ success: "ok" });
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      
      if (dbError instanceof Error) {
        if (dbError.message === "MinimumTracksReached") {
          return NextResponse.json({ error: "You must have at least one active Reading Track." }, { status: 400 });
        }
        if (dbError.message === "TrackNotEmpty") {
          return NextResponse.json({ error: "You must unassign all books before dismantling a track." }, { status: 400 });
        }
      }
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Unexpected error deleting reading track:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
};