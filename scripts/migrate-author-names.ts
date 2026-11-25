import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';
import { formatAuthorName } from '../src/lib/formatAuthor';

const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = (match[2] || '').replace(/^["']|["']$/g, '');
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const NAME_SUFFIXES = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v', 'phd', 'md'];

function reformatAuthorField(authorString: string): string {
  if (authorString.includes(';')) {
    const authors = authorString.split(';')
      .map(a => a.trim())
      .filter(a => a.length > 0)
      .filter(a => !['sparknotes', 'cliffsnotes', 'shmoop'].includes(a.toLowerCase()))
      .map(a => formatAuthorName(a));
    const deduped = [...new Map(authors.map(name => [name.toLowerCase(), name])).values()];
    return deduped.join('; ') || 'Unknown Author';
  }

  const parts = authorString.split(',').map(p => p.trim());

  if (parts.length === 1) {
    return formatAuthorName(parts[0]);
  }

  if (parts.length === 2 && !parts[0].includes(' ') && !parts[1].includes(' ')) {
    return authorString;
  }

  const authors: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      authors.push(parts[i]);
      continue;
    }
    if (NAME_SUFFIXES.includes(parts[i].toLowerCase())) {
      authors[authors.length - 1] += ', ' + parts[i];
    } else {
      authors.push(parts[i]);
    }
  }

  const formatted = authors
    .filter(a => a.length > 0)
    .filter(a => !['sparknotes', 'cliffsnotes', 'shmoop'].includes(a.toLowerCase()))
    .map(a => formatAuthorName(a));

  const deduped = [...new Map(formatted.map(name => [name.toLowerCase(), name])).values()];

  return deduped.join('; ') || 'Unknown Author';
}

async function main() {
  const { rows } = await pool.query('SELECT id, author FROM "Book" ORDER BY id');
  console.log(`Found ${rows.length} books to process.\n`);

  const changes: { id: number; oldAuthor: string; newAuthor: string }[] = [];

  for (const row of rows) {
    const newAuthor = reformatAuthorField(row.author);
    if (newAuthor !== row.author) {
      changes.push({ id: row.id, oldAuthor: row.author, newAuthor });
    }
  }

  if (changes.length === 0) {
    console.log('No changes needed. All authors are already formatted.');
    await pool.end();
    return;
  }

  console.log(`${changes.length} books need reformatting:\n`);
  for (const c of changes) {
    console.log(`  [${c.id}] "${c.oldAuthor}" → "${c.newAuthor}"`);
  }

  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('\n(Dry run — no changes applied.)');
    await pool.end();
    return;
  }

  console.log(`\nApplying ${changes.length} updates...`);

  for (const c of changes) {
    await pool.query('UPDATE "Book" SET author = $1 WHERE id = $2', [c.newAuthor, c.id]);
  }

  console.log('Done! All author names have been reformatted.');
  await pool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  pool.end();
  process.exit(1);
});
