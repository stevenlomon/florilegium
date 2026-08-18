-- Add email and email_verified to the User table
ALTER TABLE "User" ADD COLUMN email VARCHAR(255) UNIQUE;
ALTER TABLE "User" ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Verification tokens for email verification and password reset
CREATE TABLE "Verification_Token" (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email_verify', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_token_lookup ON "Verification_Token" (token, type);
