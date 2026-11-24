import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// A lot of this code borrowed from my Linkin Park E-store school project!
// https://github.com/stevenlomon/linkin-park-e-shop/tree/main/src/lib/integrations/storage
const BUCKET = 'book-covers';
const TIMEOUT_MS = 10_000;

function getSupabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SECRET_KEY) {
    throw new Error('Supabase env vars missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(SUPABASE_URL, SECRET_KEY, {
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }),
    },
  });
}