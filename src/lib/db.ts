import { Pool } from 'pg';
// dotenv is not used or needed in Next.js! Environment variables are baked into the runtime and available with `process.env`. 
// Next does natively what dotenv did manually.

// In Next.js, we also don't need to use nodemon. We have something even better. nodemon brutally murders our entire Node process and boots 
// up a brand new one from scratch every single time we save. Next.js uses Fast Refersh which instead only swaps out what has changed. But 
// with this benefits, we also run into problem with the Database Pool. 
// If we just copy-pasted your old db.ts file, Next.js would create a brand new PostgreSQL connection pool every single time we saved a file, 
// quickly maxing out our Aiven database limits and crashing.
// When building a manual backend with Exrpess + nodemon, it's never a problem since the Database Pool dies with the Node process
// Solution: cache the pool in the Node `global` object so that it survives Next.js reloads. `global` is the Node equivalent of the Browser 
// `window` object
const globalForPg = global as unknown as { pgPool: Pool }; // I've never seen two `as` but it's called Double Casting. We go straight from `obejct` -> `{ pgPool: Pool }`, we need a "clean slate" first which is `as unknown`. "TypeScript, forget everything you know about this object."

// This remains mostly unchanged compared to the Biscord code..
export const pool = 
globalForPg.pgPool || new Pool({ // ..except for this. Check the global object and create a new Pool only as fallback
  connectionString: process.env.DATABASE_URL, // We can combine our credentials into one Aiven string
  ssl: {
    rejectUnauthorized: false, // To fix `no encryption` error
  },

  // NEW: Optimizations for Aiven's 20-connection limit
  max: 2, // Limit each Next.js instance to max 2 connections instead of the default 10. 2 pooled connections cycling in milliseconds
  // handles the traffic to the server with my current user count. Until the user count and concurrent request grows!
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds so they don't hold slots open
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection fails
});

// We only use the global escape hatch in development because we have to in order to survive Hot Module Replacement. Never in production
if (process.env.NODE_ENV !== 'production') {
  globalForPg.pgPool = pool;
}