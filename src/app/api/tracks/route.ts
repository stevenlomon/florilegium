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
//   } catch (err) {
//     console.error("Error fetching reading tracks:", err);
//     return NextResponse.json({ success: "not ok" }, { status: 500 });
//   }
// };

export async function POST(req: Request) {
  // To be coded in the future when we allow users to create their own Reading Tracks. As well as a PATCH and DELETE probably for full CRUD
}

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

  } catch (err) {
    console.error("Unexpected error updating reading track:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};