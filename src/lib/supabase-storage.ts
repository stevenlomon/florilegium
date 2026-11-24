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
  const supabase = getSupabase();

  const extension = EXTENSIONS[mimeType];
  if (!extension) {
    throw new Error(`Unsupported image type: ${mimeType}`);
  }

  const path = `${userId}/${bookshelfItemId}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    upsert: false, // For the same reason in the e-store. We want the upload to fail is the path already exists. *Not* overwrite
  });

  if (error) {
    throw new Error(`Could not upload cover: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { path, url: data.publicUrl };
}

export async function removeBookCover(path: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throw new Error(`Could not delete cover: ${error.message}`);
  }
}