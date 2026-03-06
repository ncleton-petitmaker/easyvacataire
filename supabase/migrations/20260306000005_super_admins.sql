-- Super admins: platform-level admins not tied to any establishment
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_super_admins_phone ON super_admins(phone);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "service_role_super_admins" ON super_admins
  FOR ALL USING (true) WITH CHECK (true);

-- Seed: Nicolas Cléton as first super admin
INSERT INTO super_admins (phone, first_name, last_name)
VALUES ('+33760177267', 'Nicolas', 'Cléton');
