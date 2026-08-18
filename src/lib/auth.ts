import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { pool } from '@/lib/db';

// This is the equivalent of the getCurrentUser() helper function in Biscord but supercharged on steroids
export async function getCurrentUser() {
  try {
    // Grab the cookie with the "baked-in" JWT created by the Login Route Handler
    const token = (await cookies()).get('florilegium-session')?.value;

    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    // Decode and verify the JWT to extract the userId
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;

    // Fetch the user directly from Postgres using the extracted userId!
    const query = {
      name: 'fetch-current-user',
      text: 'SELECT * FROM "User" WHERE id = $1',
      values: [userId],
    };

    const res = await pool.query(query);
    const currentUser = res.rows[0];

    return currentUser || null;
  } catch (err: unknown) {
    // Next.js throws DYNAMIC_SERVER_USAGE during 'npm run build' to mark routes as dynamic.
    // We must re-throw it so Next.js can switch the route mode without logging a fake error!

    // Safely check if the error is an object and contains the Next.js specific digest without using `any`
    if (
      err !== null && 
      typeof err === 'object' && 
      'digest' in err && 
      err.digest === 'DYNAMIC_SERVER_USAGE'
    ) {
      throw err;
    }

    console.error("Unexpected Auth helper error:", err);
    return null;
  }
};