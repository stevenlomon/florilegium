// For inserting and updating items onto the user's Bookshelf. Affects the Bookshelf_Item table
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET endpoint to fetch a user's entire bookshelf
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = {
      name: 'get-user-bookshelf-all-api',
      text: `
        SELECT 
          bi.id AS bookshelf_item_id,
          bi.status_id,
          bi.user_rating,
          bi.horizon_slot,
          b.id AS book_id,
          b.external_id,
          b.title,
          b.author,
          b.cover_image_url
        FROM "Bookshelf_Item" bi
        JOIN "Book" b ON bi.book_id = b.id
        WHERE bi.user_id = $1
        ORDER BY bi.added_at DESC
      `,
      values: [user.id]
    };

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows
    });

  } catch (err) {
    console.error("Unexpected error fetching bookshelf:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
}

// POST endpoint to create a new resource in the user's bookshelf
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // The server provides all data except added_at that Postgres can automatically generate
    // When creating and inserting a bookshelf item, we omit peak_slot and user_rating; these are updated in a separate fetch
    const itemId = crypto.randomUUID();

    // We now expect that this can contain horizon_slot but also need to be prepared that it might be undefined!
    const { book_id, status_id, horizon_slot = null } = body; // horizon_slot defaults to null

    const query = {
      name: 'upsert-user-bookshelf-item', // Upgraded from insert to upsert!
      // `ON CONFLICT`, `DO UPDATE SET` and `COALESCE` all work in harmony to ensure no duplicates
      text: `
        INSERT INTO "Bookshelf_Item"(id, user_id, book_id, status_id, horizon_slot) 
        VALUES($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, book_id) 
        DO UPDATE SET 
          status_id = EXCLUDED.status_id,
          horizon_slot = COALESCE(EXCLUDED.horizon_slot, "Bookshelf_Item".horizon_slot)
        RETURNING *
      `,
      values: [itemId, user.id, book_id, status_id, horizon_slot]
    }
    const res = await pool.query(query);
    const item = res.rows[0];
    console.log("Bookshelf item insertion results", item);

    return NextResponse.json({
      success: "ok",
      data: {
        id: item.id,
        user_id: item.user_id,
        book_id: item.book_id,
        status_id: item.status_id,
      }
    });
  } catch (err) {
    console.error("Unexpected error when trying to insert Bookshelf item", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};

// The Route Handler to be called when assigning a rating to a Bookshelf Item. Completely decoupled from status; no requirement that 
// the book needs to be marked "Read" in order to rate it. It would cause more frustration overall that appreciation!
// Now also handles read status updates! Which re-wires the logic of the route handler slightly to be more flexible and dynamic
// Now also upadtes custom page count, the new row in the table!
// Now also handles Reviews
// Now also dynamically handles both Works and Editions!
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookshelf_item_id, user_rating, status_id, custom_page_count, review, book_id } = body; // Now also takes status, custom_page_count, review and book_id

    // This is now the only element in the payload that is truly required that we check before anythign else
    if (!bookshelf_item_id) {
      return NextResponse.json({ error: "Missing required bookshelf_item_id" }, { status: 400 });
    }

    // Instead, we use "gatekeeper if statements"; one for the user rating code we've already written...
    if (user_rating !== undefined) {
      // Golden Rule of Web Dev: Never trust the client haha! Even if our Frontend might ensure only valid half or whole star
      // ratings are used via a sleek Letterboxd client component, someone could still send an invalid request via Postman!
      if (user_rating !== null) { // We know now that it's not undefined, final check to ensure it's not null
        const isInvalidRating = user_rating < 0.5 || user_rating > 5.0 || (user_rating * 2) % 1 !== 0;

        if (isInvalidRating) {
          return NextResponse.json({
            error: "Rating must be a valid half or whole star rating between 0.5 to 5.0"
          }, { status: 400 });
        }
      }

      const query = {
        name: 'update-user-rating',
        text: `
        UPDATE "Bookshelf_Item" 
        SET user_rating = $1 
        WHERE id = $2 AND user_id = $3 
        RETURNING *
      `,
        values: [user_rating, bookshelf_item_id, user.id]
      };

      const res = await pool.query(query);
      const updatedUserRating = res.rows[0];

      // If rowCount is 0, it means the item didn't exist OR it didn't belong to this user
      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
      }

      console.log(`Successfully updated user rating for Bookshelf_Item with id ${bookshelf_item_id} to:`, updatedUserRating);

      return NextResponse.json({
        success: "ok",
        data: updatedUserRating
      });
    }

    // ..and one for the new code that updates the read status!
    if (status_id !== undefined) {
      // Check if it is specifically being marked as 3:"Read" which will guaranteed update the Reading Journey but also potentially
      // the UX I look forward to the most if it was the Currently Read in a Reading Track upon which there will be the "promotion"!
      if (status_id === 3) {
        // Grab a dedicated clietn from the pool for the transaction that's about to happen. This is another chonky one haha!
        const client = await pool.connect();

        try {
          await client.query('BEGIN');

          // Before anything, actually update the status of the current book to "Read"
          const updateRes = await client.query(
            'UPDATE "Bookshelf_Item" SET status_id = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [status_id, bookshelf_item_id, user.id]
          );

          if (updateRes.rowCount === 0) {
            throw new Error("ItemNotOwned");
          }

          // *The important and exciting check: Is the book currently active ("Currently Reading") in a Reading Track?*
          let trackTitle = null;
          let promotedBookTitle = null;
          let finishedJourneyId = null;

          const trackCheckRes = await client.query(`
            SELECT rt.id AS track_id, rt.name AS track_name, rt.follow_up_book_id, rj.id AS journey_id
            FROM "Reading_Track" rt
            JOIN "Reading_Journey" rj ON rt.reading_journey_id = rj.id
            WHERE rj.bookshelf_item_id = $1 AND rt.user_id = $2 AND rj.finished_at IS NULL
          `, [bookshelf_item_id, user.id]);

          if ((trackCheckRes.rowCount ?? 0) > 0) {
            // If it is; first of all, close the connected Reading Journey with timestamp finished_at = NOW()
            const track = trackCheckRes.rows[0];
            finishedJourneyId = track.journey_id;
            await client.query(
              'UPDATE "Reading_Journey" SET finished_at = NOW() WHERE id = $1',
              [track.journey_id]
            );

            // Is there a Follow-up in that same Reading Track?
            if (track.follow_up_book_id) {
              // If it is: Promote it!! 🌿 Mark it as 2:"Currently Reading"
              await client.query(
                'UPDATE "Bookshelf_Item" SET status_id = 2 WHERE id = $1 AND user_id = $2',
                [track.follow_up_book_id, user.id]
              );

              // Calculate the iteration for the book that is to be promoted (First read? Second? Third?)
              const iterRes = await client.query(
                'SELECT COUNT(*) FROM "Reading_Journey" WHERE bookshelf_item_id = $1',
                [track.follow_up_book_id]
              );
              const nextIteration = parseInt(iterRes.rows[0].count, 10) + 1;

              // Create a brand new Reading Journey for the book-to-be-promoted. current_page defaults to 0. Might change this and actually prompt the user to enter "What page?" but 0 for now
              const newJourneyId = crypto.randomUUID();
              await client.query(
                'INSERT INTO "Reading_Journey" (id, current_page, bookshelf_item_id, iteration) VALUES ($1, 0, $2, $3)',
                [newJourneyId, track.follow_up_book_id, nextIteration]
              );

              // Promote ti and update the track! Slot the new journey in, and empty out the follow-up slot 🌿
              await client.query(
                'UPDATE "Reading_Track" SET reading_journey_id = $1, follow_up_book_id = NULL WHERE id = $2',
                [newJourneyId, track.track_id]
              );

              // Grab the actual string title of the promoted book to show in the UI
              const titleRes = await client.query(`
                SELECT b.title FROM "Bookshelf_Item" bi
                JOIN "Book" b ON bi.book_id = b.id WHERE bi.id = $1
              `, [track.follow_up_book_id]);

              if ((titleRes.rowCount ?? 0) > 0) {
                promotedBookTitle = titleRes.rows[0].title;
                trackTitle = track.track_name;
              }
            } else {
              // If there was no follow-up, we still need to clear the active journey from the track
              await client.query(
                'UPDATE "Reading_Track" SET reading_journey_id = NULL WHERE id = $1',
                [track.track_id]
              );
              trackTitle = track.track_name; // We still pass the track name so the UI can say something like "Assign a new book to Fiction!"
            }
          }

          // If we reach this point of the code, it's safe to commit!
          await client.query('COMMIT');

          // Respond with a special payload!
          return NextResponse.json({
            success: "ok",
            data: updateRes.rows[0],
            promotion: trackTitle ? { // Only attach promotion data if a track was actually affected
              promotedBook: promotedBookTitle,
              trackName: trackTitle,
              finishedJourneyId // I don't think I've ever seen this before; if the key and value are the same, we can write it like this!
            } : null
          });

        } catch (dbError) {
          await client.query('ROLLBACK');
          // Check if it's an Error object before checking its message
          if (dbError instanceof Error && dbError.message === "ItemNotOwned") {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
          }
          console.error("Reading Track Promotion Transaction Failed:", dbError);
          throw dbError;
        } finally {
          client.release(); // We always release the dedicated client no matter the outcome
        }

      } else {
        // Else, we fall back to what we already had. Standard read status update
        const query = {
          name: 'update-status-id',
          text: `
          UPDATE "Bookshelf_Item" 
          SET status_id = $1 
          WHERE id = $2 AND user_id = $3 
          RETURNING *
        `,
          values: [status_id, bookshelf_item_id, user.id]
        };

        const res = await pool.query(query);
        if (res.rowCount === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
        return NextResponse.json({ success: "ok", data: res.rows[0] });
      }
    }

    // The new custom_page_count is a simple PATCH, less like read status and more like user rating but even simpler
    if (custom_page_count !== undefined) {
      // Once again; Golden Rule of Web Dev: Never trust the client. We want to trust our users! We genuinely do. But if they have intentions of
      // breaking the app or are just fuckin around testing edge cases with negative numbers of obscenely large ones, we genly bring them back to earth
      if (custom_page_count !== null) { // We know now that it's not undefined, final check to ensure it's not null
        if (custom_page_count < 1 || custom_page_count > 5000) {
          return NextResponse.json({
            error: "Custom page count must be an integer between 1 to 5000 (even À la recherche du temps perdu is only ~2400!)"
          }, { status: 400 });
        }
      }

      const query = {
        name: 'update-custom-page-count',
        text: `
        UPDATE "Bookshelf_Item" 
        SET custom_page_count = $1 
        WHERE id = $2 AND user_id = $3 
        RETURNING *
      `,
        values: [custom_page_count, bookshelf_item_id, user.id]
      };

      const res = await pool.query(query);
      const updatedCustomPageCount = res.rows[0];

      // If rowCount is 0, it means the item didn't exist OR it didn't belong to this user
      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
      }

      console.log(`Successfully updated custom page count for Bookshelf_Item with id ${bookshelf_item_id} to:`, updatedCustomPageCount);

      return NextResponse.json({
        success: "ok",
        data: updatedCustomPageCount
      });
    }

    // Our new Review gatekeeper
    if (review !== undefined) {
      const query = {
        name: 'update-review',
        text: `
        UPDATE "Bookshelf_Item" 
        SET review = $1 
        WHERE id = $2 AND user_id = $3 
        RETURNING *
      `,
        // If it's an empty string, we convert it to null to keep the DB clean
        values: [review ? review.trim() : null, bookshelf_item_id, user.id]
      };

      const res = await pool.query(query);
      const updatedReview = res.rows[0];

      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
      }

      console.log(`Successfully updated review for Bookshelf_Item with id ${bookshelf_item_id}`);

      return NextResponse.json({
        success: "ok",
        data: updatedReview
      });
    }

    // Our book_id "Gatekeeper" handles Edition Swapping by updating the linked book_id!
    if (book_id !== undefined) {
      const query = {
        name: 'update-bookshelf-item-book-id',
        text: `
      UPDATE "Bookshelf_Item"
      SET book_id = $1
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `,
        values: [book_id, bookshelf_item_id, user.id]
      };

      const res = await pool.query(query);
      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
      }

      return NextResponse.json({ success: "ok", data: res.rows[0] });
    }

    // And for this "gatekeeper" logic to fully work, we need a fallback in case the payload doesn't acutally contain a valid
    // user rating, status upadte, review or anything of the sort
    return NextResponse.json({
      error: "No valid fields provided for update (expected user_rating or status_id (for now))"
    }, { status: 400 });

  } catch (err) {
    console.error("Unexpected error in user rating assignment:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};