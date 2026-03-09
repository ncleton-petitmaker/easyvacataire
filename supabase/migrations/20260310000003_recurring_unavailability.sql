-- Règles d'indisponibilité récurrentes (ex: jamais dispo mercredi après-midi)
CREATE TABLE recurring_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervenant_id UUID NOT NULL REFERENCES intervenants(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=lundi, 6=dimanche
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  label TEXT, -- ex: "Cours à l'extérieur"
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recurring_unavail_intervenant ON recurring_unavailability(intervenant_id);
