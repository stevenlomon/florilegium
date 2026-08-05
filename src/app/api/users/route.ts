import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';
import { getCurrentUser } from '@/lib/auth'; // Needed for the PATCH route

export async function POST(req: Request) {
  try {
    const userId = crypto.randomUUID();

    const body = await req.json(); // In Next.js, we don't need `app.use(express.json());`, JSON is the default! And this is how we grab the body
    const rawPassword = body.password; // This is now the direct equivalent of `const rawPassword = req.body.password;` from my Biscord code
    const username = body.username;

    // Explicitly check if the username is already taken (Case-Insensitive)
    const checkRes = await pool.query(
      'SELECT id FROM "User" WHERE LOWER(username) = LOWER($1)',
      [username]
    );

    // If rowCount is greater than 0, a match was found! Return a 409 Conflict.
    if ((checkRes.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { success: "not ok", error: "Username already taken" },
        { status: 409 }
      );
    }

    // If the check passes, proceed with creation
    const hashedPassword = await bcrypt.hash(rawPassword, 10); // Untouched from Biscord!

    // Unlike Biscord where we have auth_id in the User table, we now have user_id in the Auth table which is more pragmatic. We therefore need to create the User first, then the Auth entry

    // First query for the User row. We handle id and username server-side, our Postgre DB handles created_at and sets first_name as a default NULL
    const result1 = await pool.query('INSERT INTO "User"(id, username) VALUES ($1, $2) RETURNING *', [userId, username]);
    console.log("User table insertion result", result1.rows[0]);

    // Now creating the Auth row with user_id as FK as the second entry
    const result2 = await pool.query('INSERT INTO "Auth"(user_id, hashed_password) VALUES($1, $2) RETURNING *', [userId, hashedPassword]); // Still using parameterized queries
    console.log("Auth table insertion result", result2.rows[0]);

    // NEW: Plant the initial Reading Tracks for the new user! Moved here from ReadingTracksSection.tsx
    const defaultTracks = [
      { name: 'Fiction', description: 'Immersive narratives and alternate realities.' },
      { name: 'Non-fiction', description: 'Expanding models of reality and actionable knowledge.' },
      { name: 'Before Bedtime', description: 'Wind-down reading. Low stakes, high comfort.' }
    ];

    for (const track of defaultTracks) {
      await pool.query(
        'INSERT INTO "Reading_Track" (user_id, name, description) VALUES ($1, $2, $3)',
        [userId, track.name, track.description]
      );
    }
    console.log(`Seeded 3 default reading tracks for user ${username}`);

    // `res.status(201).json({` is replaced with..
    return NextResponse.json({
      success: "ok",
      data: {
        id: userId,
        username: username,
        hashed_pw: hashedPassword,
      }
    },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error when trying to create new User", err);
    return NextResponse.json({ success: "not ok" }, { status: 500 });
  }
};

// PATCH route for updating username and first_name (Display Name)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, first_name } = body;

    // Guardrail 1: Username & Display Name validation
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long." }, 
        { status: 400 }
      );
    }

    if (!first_name || first_name.trim().length === 0) {
      return NextResponse.json(
        { error: "Display name cannot be empty." }, 
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanFirstName = first_name.trim();

    // Guardrail 2: Ensure the chosen username isn't already taken by SOMEONE ELSE
    const checkRes = await pool.query(
      'SELECT id FROM "User" WHERE LOWER(username) = LOWER($1) AND id != $2',
      [cleanUsername, user.id]
    );

    if ((checkRes.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { success: "not ok", error: "That username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // Execute the update
    const query = {
      name: 'update-user-profile',
      text: `
        UPDATE "User" 
        SET username = $1, first_name = $2 
        WHERE id = $3 
        RETURNING id, username, first_name
      `,
      values: [cleanUsername, cleanFirstName, user.id]
    };

    const res = await pool.query(query);

    return NextResponse.json({
      success: "ok",
      data: res.rows[0]
    });

  } catch (err) {
    console.error("Unexpected error updating user profile:", err);
    return NextResponse.json({ success: "not ok", error: (err as Error).message }, { status: 500 });
  }
};