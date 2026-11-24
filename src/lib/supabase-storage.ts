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

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const ALLOWED_MIME_TYPES = Object.keys(EXTENSIONS);
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadBookCover(userId: string, bookshelfItemId: string, buffer: Buffer, mimeType: string): Promise<{ path: string; url: string }> {
  return {path: "Code to be written soon", url: "Code to be written soon"}
}