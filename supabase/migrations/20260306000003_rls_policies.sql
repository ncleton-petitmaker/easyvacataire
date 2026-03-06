-- Enable RLS on all tables
ALTER TABLE etablissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilites_intervenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE besoins_etablissement ENABLE ROW LEVEL SECURITY;
ALTER TABLE creneaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE creneaux_changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by API routes)
-- Authenticated users: scoped to their etablissement

-- Intervenants can see their own data
CREATE POLICY "intervenants_own" ON intervenants
  FOR SELECT USING (auth.uid() = user_id);

-- Intervenants can see their creneaux
CREATE POLICY "creneaux_own" ON creneaux
  FOR SELECT USING (
    intervenant_id IN (
      SELECT id FROM intervenants WHERE user_id = auth.uid()
    )
  );

-- Intervenants can manage their disponibilites
CREATE POLICY "dispos_own_select" ON disponibilites_intervenant
  FOR SELECT USING (
    intervenant_id IN (
      SELECT id FROM intervenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "dispos_own_insert" ON disponibilites_intervenant
  FOR INSERT WITH CHECK (
    intervenant_id IN (
      SELECT id FROM intervenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "dispos_own_delete" ON disponibilites_intervenant
  FOR DELETE USING (
    intervenant_id IN (
      SELECT id FROM intervenants WHERE user_id = auth.uid()
    )
  );

-- Admins can see everything in their etablissement
CREATE POLICY "admin_etablissements" ON etablissements
  FOR ALL USING (
    id IN (
      SELECT etablissement_id FROM intervenants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_intervenants" ON intervenants
  FOR ALL USING (
    etablissement_id IN (
      SELECT etablissement_id FROM intervenants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_matieres" ON matieres
  FOR ALL USING (
    etablissement_id IN (
      SELECT etablissement_id FROM intervenants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_besoins" ON besoins_etablissement
  FOR ALL USING (
    etablissement_id IN (
      SELECT etablissement_id FROM intervenants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_creneaux" ON creneaux
  FOR ALL USING (
    etablissement_id IN (
      SELECT etablissement_id FROM intervenants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_knowledge" ON knowledge_base
  FOR ALL USING (
    etablissement_id IN (
      SELECT etablissement_id FROM intervenants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Knowledge embeddings follow knowledge_base access
CREATE POLICY "knowledge_embeddings_read" ON knowledge_embeddings
  FOR SELECT USING (
    etablissement_id IN (
      SELECT etablissement_id FROM intervenants
      WHERE user_id = auth.uid()
    )
  );
