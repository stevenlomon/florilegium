import crypto from 'crypto';
import { pool } from '@/lib/db';

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createVerificationToken(
  userId: string,
  type: 'email_verify' | 'password_reset'
): Promise<string> {
  const token = generateToken();
  const expiresAt = type === 'email_verify'
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO "Verification_Token" (id, user_id, token, type, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [crypto.randomUUID(), userId, token, type, expiresAt]
  );

  return token;
}

export async function validateToken(
  token: string,
  type: 'email_verify' | 'password_reset'
): Promise<{ userId: string; tokenId: string } | null> {
  const res = await pool.query(
    `SELECT id, user_id FROM "Verification_Token"
     WHERE token = $1 AND type = $2 AND expires_at > NOW() AND used_at IS NULL`,
    [token, type]
  );

  if (res.rowCount === 0) return null;

  return { userId: res.rows[0].user_id, tokenId: res.rows[0].id };
}

export async function markTokenUsed(tokenId: string): Promise<void> {
  await pool.query(
    `UPDATE "Verification_Token" SET used_at = NOW() WHERE id = $1`,
    [tokenId]
  );
}
