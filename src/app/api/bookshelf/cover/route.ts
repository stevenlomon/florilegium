import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { uploadBookCover, removeBookCover, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/supabase-storage';

// This route handler code is essentially identical to what I wrote for my Linkin Park E-Store school project!
// https://github.com/stevenlomon/linkin-park-e-shop/blob/main/src/app/api/products/[id]/images/route.ts
export async function POST(req: Request) {
  try {
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bookshelfItemId = formData.get('bookshelf_item_id') as string | null;
    
    if (!file || !bookshelfItemId) {
      return NextResponse.json({ error: "Missing file or bookshelf_item_id" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, and WebP images are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });
    }

    const ownerCheck = await pool.query(
      'SELECT id, custom_cover_path FROM "Bookshelf_Item" WHERE id = $1 AND user_id = $2',
      [bookshelfItemId, user.id]
    );

    if (ownerCheck.rowCount === 0) {
      return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
    }

    const existingPath = ownerCheck.rows[0].custom_cover_path;
    if (existingPath) {
      await removeBookCover(existingPath).catch((err) =>
        console.error("Failed to remove old cover, continuing:", err)
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { path, url } = await uploadBookCover(user.id, bookshelfItemId, buffer, file.type);

    await pool.query(
      'UPDATE "Bookshelf_Item" SET custom_cover_url = $1, custom_cover_path = $2 WHERE id = $3 AND user_id = $4',
      [url, path, bookshelfItemId, user.id]
    );

    return NextResponse.json({ success: "ok", data: { custom_cover_url: url } });
  } catch (error) {
    console.error("Unexpected error uploading book cover:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookshelf_item_id } = body;

    if (!bookshelf_item_id) {
      return NextResponse.json({ error: "Missing bookshelf_item_id" }, { status: 400 });
    }

    const res = await pool.query(
      'SELECT custom_cover_path FROM "Bookshelf_Item" WHERE id = $1 AND user_id = $2',
      [bookshelf_item_id, user.id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
    }

    const coverPath = res.rows[0].custom_cover_path;

    if (coverPath) {
      await removeBookCover(coverPath);
    }

    await pool.query(
      'UPDATE "Bookshelf_Item" SET custom_cover_url = NULL, custom_cover_path = NULL WHERE id = $1 AND user_id = $2',
      [bookshelf_item_id, user.id]
    );

    return NextResponse.json({ success: "ok" });

  } catch (error) {
    console.error("Unexpected error removing book cover:", error);
    return NextResponse.json({ success: "not ok", error: (error as Error).message }, { status: 500 });
  }
}