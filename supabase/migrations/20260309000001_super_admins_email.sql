-- Add email column to super_admins for email OTP auth
ALTER TABLE super_admins ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);

-- Set Nicolas's email
UPDATE super_admins SET email = 'nicoc.spam@gmail.com' WHERE phone = '+33760177267';
