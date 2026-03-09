-- Demandes de disponibilité : file d'attente pour valider les créneaux avec les vacataires
CREATE TABLE demandes_disponibilite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  besoin_id UUID NOT NULL REFERENCES besoins_etablissement(id) ON DELETE CASCADE,
  intervenant_id UUID NOT NULL REFERENCES intervenants(id) ON DELETE CASCADE,
  etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'accepted', 'refused', 'expired')),
  priority INT NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_token TEXT,
  whatsapp_message_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_demandes_dispo_intervenant ON demandes_disponibilite(intervenant_id);
CREATE INDEX idx_demandes_dispo_besoin ON demandes_disponibilite(besoin_id);
CREATE INDEX idx_demandes_dispo_status ON demandes_disponibilite(status);
CREATE UNIQUE INDEX idx_demandes_dispo_token ON demandes_disponibilite(response_token)
  WHERE response_token IS NOT NULL;

-- Ajouter le statut "en_attente" pour les besoins
ALTER TABLE besoins_etablissement
  DROP CONSTRAINT IF EXISTS besoins_etablissement_status_check;
ALTER TABLE besoins_etablissement
  ADD CONSTRAINT besoins_etablissement_status_check
  CHECK (status IN ('ouvert', 'attribue', 'en_attente', 'annule', 'pourvu'));

-- RLS
ALTER TABLE demandes_disponibilite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access demandes" ON demandes_disponibilite
  FOR ALL USING (true) WITH CHECK (true);
