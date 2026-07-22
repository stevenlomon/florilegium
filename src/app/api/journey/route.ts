import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { pool } from '@/lib/db';

// Used to update current_page of a current and active user Reading Joruney
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { bookshelf_item_id, current_page } = body;

    if (!bookshelf_item_id || current_page === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const query = {
      name: 'update-active-journey-progress',
      // First time EXISTS is used in the codebase! It acts as an inline security check here to ensure this user actually owns the bookshelf 
      // item. It's especially important to do these types of checks when using UPDATE. "But we have other UPDATE clauses in the codebase?"
      // Yes. But in these other cases we're looking at *direct ownership*. Here, in the case of updating current_page of the Reading Journey,
      // we're looking at *inherited ownership*. Reading_Journey doesn't have `user_id` in it. It inherits it from the Bookshelf_Item table!
      // This is where EXISTS truly gets to shine. 
      // The query below *could* also be written using JS surrounding this query. But it would require two queries! If possible, we wanna 
      // condense everything into one cohesive query to keep the "trips to the database" as few as possible!
      // Also this line `AND finished_at IS NULL` ensures it's the active iteration
      text: `
        UPDATE "Reading_Journey"
        SET current_page = $1
        WHERE bookshelf_item_id = $2 
          AND finished_at IS NULL
          AND EXISTS (
            SELECT 1 
            FROM "Bookshelf_Item" bi 
            WHERE bi.id = "Reading_Journey".bookshelf_item_id 
              AND bi.user_id = $3
          )
        RETURNING id, current_page;
      `,
      values: [current_page, bookshelf_item_id, user.id]
    };

    const res = await pool.query(query);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'No active reading journey found for this book' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated.',
      data: res.rows[0]
    });

  } catch (error) {
    console.error('Error updating journey progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};

// Used to retroactively add past Reading Journeys. I genuinely look forward to this!
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { bookshelf_item_id, started_at, finished_at, notes } = body;

    // Only bookshelf_item_id and finished_at are strictly required! started_at is allow to be blurry. Human memory isn't an atomic clock!
    if (!bookshelf_item_id || !finished_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Allow started_at to be optional / null
      const journeyStartedAt = started_at && started_at.trim() !== '' ? started_at : null;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Guardrail: Verify the user actually owns this bookshelf item
      const ownershipCheck = await client.query(
        'SELECT id FROM "Bookshelf_Item" WHERE id = $1 AND user_id = $2',
        [bookshelf_item_id, user.id]
      );

      if (ownershipCheck.rowCount === 0) {
        throw new Error("ItemNotOwned");
      }

      // 2. Calculate the Iteration (1st read? 3rd read?)
      const iterationRes = await client.query(
        'SELECT COUNT(*) FROM "Reading_Journey" WHERE bookshelf_item_id = $1',
        [bookshelf_item_id]
      );

      // Parse the count string to an integer and add 1. If there are no recorded Reading Journeys, this will be the first!
      const nextIteration = parseInt(iterationRes.rows[0].count, 10) + 1;

      // 3. Create the Reading Journey
      const newJourneyId = crypto.randomUUID();

      await client.query(
        `INSERT INTO "Reading_Journey" (id, current_page, bookshelf_item_id, iteration, started_at, finished_at)
         VALUES ($1, 0, $2, $3, $4, $5)`,
        // current_page is irrelevant for finished past journeys, so 0 is a clean default
        [newJourneyId, bookshelf_item_id, nextIteration, journeyStartedAt, finished_at]
      );

      // 4. Optionally capture their raw thoughts from that specific read-through
      if (notes && notes.trim().length > 0) {
        const newLogId = crypto.randomUUID();
        await client.query(
          `INSERT INTO "Reading_Log_Post" (id, user_id, reading_journey_id, notes)
           VALUES ($1, $2, $3, $4)`,
          [newLogId, user.id, newJourneyId, notes.trim()]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: "ok",
        message: "Retroactive journey added successfully"
      });

    } catch (dbError) {
      await client.query('ROLLBACK');

      if (dbError instanceof Error && dbError.message === "ItemNotOwned") {
        return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
      }

      console.error('Retroactive Journey Transaction Failed:', dbError);
      throw dbError;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating retroactive journey:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};