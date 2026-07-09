import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// This is intentionally placed differently than our assignment Route Handler. That's an *action*, it doesn't create or retrieve a resource.
// Therefore, it gets to live in /api/tracks/assign, while the two down below gets to live here in /api/tracks
// Only coding the essential GET Route Handler for now, the POST one to create custom Reading Tracks will be coded in the future. For now, 
// we'll use my three hard coded ones

export async function GET(_req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = {
      name: 'get-user-reading-tracks',
      // Also quite a chonky query. We're need JOIN cuz a simple 'SELECT * FROM "Reading_Track" WHERE user_id = $1' wouldn't
      // return title, author and the cover_image_url! 
      // And we glue together the two subqueries that use JOIN with a UNION ALL. Instead of adding data horizontally with more columns
      // like JOIN, UNION ALL expands the dataset *vertically* by stacking them, adding more rows. It glues the two very differnt queries
      // (the way that Currently Reading and Follow-up are stored are very different; one looks at Reading_Journey, the other looks at
      // Bookshelf_Item) into a unified list. 
      // Using UNION ALL instead of UNION saves us speed and performance. "Just blind-stack these rows. I don't care if there are duplicates" 
      // Since we explicitly hardcoded 1 AS slot_id in the first query and 2 AS slot_id in the second query, it is mathematically impossible 
      // for the rows to be duplicates.
      text: `
        -- SLOT 1: Currently Reading (Linked via Reading_Journey)
        SELECT 
          LOWER(REPLACE(rt.name, ' ', '-')) AS track_id, -- Maps 'Before Bedtime' to 'before-bedtime'
          1 AS slot_id,
          b.id AS book_id,
          b.external_id,
          b.title,
          b.author,
          b.cover_image_url
        FROM "Reading_Track" rt
        JOIN "Reading_Journey" rj ON rt.reading_journey_id = rj.id
        JOIN "Bookshelf_Item" bi ON rj.bookshelf_item_id = bi.id
        JOIN "Book" b ON bi.book_id = b.id
        WHERE rt.user_id = $1

        UNION ALL

        -- SLOT 2: Follow-up (Linked directly via Bookshelf_Item)
        SELECT 
          LOWER(REPLACE(rt.name, ' ', '-')) AS track_id,
          2 AS slot_id,
          b.id AS book_id,
          b.external_id,
          b.title,
          b.author,
          b.cover_image_url
        FROM "Reading_Track" rt
        JOIN "Bookshelf_Item" bi ON rt.follow_up_book_id = bi.id
        JOIN "Book" b ON bi.book_id = b.id
        WHERE rt.user_id = $1
      `,
      values: [user.id]
    };

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows
    });
  } catch (err) {
    console.error("Error fetching reading tracks:", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};

export async function POST(req: Request) {
  // To be coded in the future when we allow users to create their own Reading Tracks. As well as a PATCH and DELETE probably for full CRUD
}