-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Etablissements / composantes universitaires
CREATE TABLE etablissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  evolution_instance_name TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intervenants (externes + admins)
CREATE TABLE intervenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID REFERENCES etablissements(id),
  user_id UUID REFERENCES auth.users(id),
  phone TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  specialite TEXT,
  role TEXT DEFAULT 'intervenant', -- 'intervenant' | 'admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_intervenants_phone ON intervenants(phone);
CREATE INDEX idx_intervenants_etablissement ON intervenants(etablissement_id);

-- Matieres / modules d'enseignement
CREATE TABLE matieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID REFERENCES etablissements(id),
  code TEXT,
  name TEXT NOT NULL,
  volume_horaire_total INTEGER, -- en minutes
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disponibilites des intervenants
CREATE TABLE disponibilites_intervenant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervenant_id UUID REFERENCES intervenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  source TEXT DEFAULT 'web', -- 'web' | 'whatsapp'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dispos_intervenant ON disponibilites_intervenant(intervenant_id, date);

-- Besoins de l'etablissement (creneaux a pourvoir)
CREATE TABLE besoins_etablissement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID REFERENCES etablissements(id),
  matiere_id UUID REFERENCES matieres(id),
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  salle TEXT,
  notes TEXT,
  status TEXT DEFAULT 'ouvert', -- 'ouvert' | 'attribue' | 'annule'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_besoins_etablissement ON besoins_etablissement(etablissement_id, date);
CREATE INDEX idx_besoins_status ON besoins_etablissement(status);

-- Creneaux confirmes (resultat du matching)
CREATE TABLE creneaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  besoin_id UUID REFERENCES besoins_etablissement(id),
  intervenant_id UUID REFERENCES intervenants(id),
  matiere_id UUID REFERENCES matieres(id),
  etablissement_id UUID REFERENCES etablissements(id),
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  salle TEXT,
  status TEXT DEFAULT 'confirme', -- 'confirme' | 'annule' | 'modifie'
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creneaux_intervenant ON creneaux(intervenant_id, date);
CREATE INDEX idx_creneaux_etablissement ON creneaux(etablissement_id, date);

-- Historique des changements de creneaux
CREATE TABLE creneaux_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creneau_id UUID REFERENCES creneaux(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Codes OTP
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone, used, expires_at);

-- Conversations WhatsApp
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID REFERENCES etablissements(id),
  intervenant_id UUID REFERENCES intervenants(id),
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- 'inbound' | 'outbound'
  content TEXT,
  message_type TEXT DEFAULT 'text',
  whatsapp_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger pour mettre a jour updated_at sur creneaux
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creneaux_updated_at
  BEFORE UPDATE ON creneaux
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger pour logger les changements de creneaux
CREATE OR REPLACE FUNCTION log_creneau_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.salle IS DISTINCT FROM NEW.salle THEN
    INSERT INTO creneaux_changelog (creneau_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'salle', OLD.salle, NEW.salle);
  END IF;
  IF OLD.heure_debut IS DISTINCT FROM NEW.heure_debut THEN
    INSERT INTO creneaux_changelog (creneau_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'heure_debut', OLD.heure_debut::text, NEW.heure_debut::text);
  END IF;
  IF OLD.heure_fin IS DISTINCT FROM NEW.heure_fin THEN
    INSERT INTO creneaux_changelog (creneau_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'heure_fin', OLD.heure_fin::text, NEW.heure_fin::text);
  END IF;
  IF OLD.date IS DISTINCT FROM NEW.date THEN
    INSERT INTO creneaux_changelog (creneau_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'date', OLD.date::text, NEW.date::text);
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO creneaux_changelog (creneau_id, field_changed, old_value, new_value)
    VALUES (NEW.id, 'status', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creneaux_changelog_trigger
  AFTER UPDATE ON creneaux
  FOR EACH ROW EXECUTE FUNCTION log_creneau_change();
