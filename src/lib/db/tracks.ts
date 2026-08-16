import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// The monster query is moved out of the GET Route Handler (frankly it's too big for a Route Handler haha!) and into its own dedicated
// Data Access Layer file, just like bookshelf.ts
export async function getReadingTracks() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Since we want the name and description of a Reading Track to be persistent, we need to grab it this data too from the database! And 
  // since the query we already have relies on JOIN, it completely ignores a track if has zero assigned book! Since the user needs to 
  // always be able to see their Reading Tracks, even when they are technically empty, we'll fetch the Track metadata separately from
  // the assigned books

  // The first query only focuses on the Reading Track metadata: name and description
  const tracksQuery = {
    name: 'get-user-reading-tracks-metadata',
    text: `
      SELECT 
        id, 
        name AS title, 
        description 
      FROM "Reading_Track" 
      WHERE user_id = $1 
      ORDER BY id ASC
    `,
    values: [user.id]
  };
  const tracksRes = await pool.query(tracksQuery);

  // Our previous monster query haha. Focuses only on fetching the assigned books (in any)
  const assignmentsQuery = {
    name: 'get-user-reading-track-assignments',
    // Also quite a chonky query. We're need JOIN cuz a simple 'SELECT * FROM "Reading_Track" WHERE user_id = $1' wouldn't
    // return title, author and the cover_image_url! 
    // And we glue together the two subqueries that use JOIN with a UNION ALL. Instead of adding data horizontally with more columns
    // like JOIN, UNION ALL expands the dataset *vertically* by stacking them, adding more rows. It glues the two very differnt queries
    // (the way that Currently Reading and Follow-up are stored are very different; one looks at Reading_Journey, the other looks at
    // Bookshelf_Item) into a unified list. 
    // Using UNION ALL instead of UNION saves us speed and performance. "Just blind-stack these rows. I don't care if there are duplicates" 
    // Since we explicitly hardcoded 1 AS slot_id in the first query and 2 AS slot_id in the second query, it is mathematically impossible 
    // for the rows to be duplicates.
    // Update: Now also includes bookshelf_item_id which is needed from the Reading Tracks UI
    // Update: Now also include custom_page_count and page_count for the real Progress Tracker
    // Update: Now also includes current_page for the Progress Tracker
    // Update: NOw also includes horizon_slot for Horizon Recognition!
    text: `
      -- SLOT 1: Currently Reading (Linked via Reading_Journey)
      SELECT 
        rt.id AS track_id, -- No more string manipulation needed!
        1 AS slot_id,
        b.id AS book_id,
        b.external_id,
        b.title,
        b.author,
        b.cover_image_url,
        b.page_count_estimate, 
        b.page_count_exact,
        bi.id AS bookshelf_item_id,
        bi.custom_page_count,
        rj.current_page, -- Bug fixed: current_page added here so that we don't see a permanent 0 haha
        bi.horizon_slot
      FROM "Reading_Track" rt
      JOIN "Reading_Journey" rj ON rt.reading_journey_id = rj.id
      JOIN "Bookshelf_Item" bi ON rj.bookshelf_item_id = bi.id
      JOIN "Book" b ON bi.book_id = b.id
      WHERE rt.user_id = $1

      UNION ALL

      -- SLOT 2: Follow-up (Linked directly via Bookshelf_Item)
      SELECT
        rt.id AS track_id, -- No more string manipulation needed!
        2 AS slot_id,
        b.id AS book_id,
        b.external_id,
        b.title,
        b.author,
        b.cover_image_url,
        b.page_count_estimate,
        b.page_count_exact,
        bi.id AS bookshelf_item_id,
        bi.custom_page_count,
        NULL AS current_page, -- Required! Both sides of a UNION ALL needs to have the exact same mathching numbers of columns
        bi.horizon_slot
      FROM "Reading_Track" rt
      JOIN "Bookshelf_Item" bi ON rt.follow_up_book_id = bi.id
      JOIN "Book" b ON bi.book_id = b.id
      WHERE rt.user_id = $1
    `,
    values: [user.id]
  };

  const assignmentsRes = await pool.query(assignmentsQuery);

  // We return both payloads bundled nicely together!
  return {
    metadata: tracksRes.rows,
    assignments: assignmentsRes.rows
  }
};