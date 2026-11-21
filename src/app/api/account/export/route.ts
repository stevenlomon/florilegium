import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const STATUS_LABELS: Record<number, string> = {
  1: 'Intend to Read',
  2: 'Currently Reading',
  3: 'Read',
  4: 'Dropped',
};

// Helper function to handle comma, quotes and newlines in reviews and titles so that the CSV doesn't break in Excel
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`; // Using the regex global flag to replace all instances, not just the first one
  }
  return value;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // This is a *chonky* query haha. But it only uses things we've already seen elsewhere in the codebase in other queries
    const result = await pool.query(
      `SELECT
        b.title,
        b.author,
        bi.status_id,
        bi.user_rating,
        bi.review,
        bi.custom_page_count,
        COALESCE(b.page_count_exact, b.page_count_estimate) AS page_count,
        bi.added_at,
        COALESCE(
          json_agg(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags,
        COALESCE(
          json_agg(DISTINCT rcr.recommended_by) FILTER (WHERE rcr.id IS NOT NULL),
          '[]'
        ) AS recommended_by,
        (SELECT COUNT(DISTINCT rj.id) FROM "Reading_Journey" rj
         WHERE rj.bookshelf_item_id = bi.id AND rj.finished_at IS NOT NULL
        ) AS times_read
      FROM "Bookshelf_Item" bi
      JOIN "Book" b ON bi.book_id = b.id
      LEFT JOIN "Bookshelf_Item_Tag" bit ON bi.id = bit.bookshelf_item_id
      LEFT JOIN "Tag" t ON bit.tag_id = t.id
      LEFT JOIN "Recommendation_Context_Row" rcr ON bi.id = rcr.bookshelf_item_id
      WHERE bi.user_id = $1
      GROUP BY bi.id, b.id
      ORDER BY bi.added_at DESC`,
      [user.id]
    );

    const headers = ['Title', 'Author', 'Status', 'Rating', 'Tags', 'Review', 'Page Count', 'Times Read', 'Recommended By', 'Added At'];
    
    // csvRows is simply an array where the first value is the headers/columns row. We will push the rest of the rows below
    const csvRows = [headers.join(',')];

    for (const row of result.rows) {
      // We want tags and recommendedBy as comma-separated strings
      const tags = (row.tags as string[]).join(', ');
      const recommendedBy = (row.recommended_by as string[]).join(', ');

      // And we want addedAt as a human-readable string rather than ISO
      const addedAt = new Date(row.added_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      // Push to the array as a comma-separated row
      csvRows.push([
        escapeCsvField(row.title || ''),
        escapeCsvField(row.author || ''),
        STATUS_LABELS[row.status_id] || 'Unknown',
        row.user_rating != null ? String(row.user_rating) : '',
        escapeCsvField(tags),
        escapeCsvField(row.review || ''),
        row.custom_page_count != null ? String(row.custom_page_count) : (row.page_count != null ? String(row.page_count) : ''),
        String(row.times_read || 0),
        escapeCsvField(recommendedBy),
        escapeCsvField(addedAt),
      ].join(','));
    }

    // To convert the array to an actual csv text file, we now simply join all the array values with a newline special character
    const csv = csvRows.join('\n');

    // We work with `Response` from the native Fetch API now rather than `NextResponse` since we're working with a file and not JSON!
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="florilegium-library-${user.username}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}