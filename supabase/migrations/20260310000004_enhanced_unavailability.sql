-- Permettre day_of_week = NULL (tous les jours) ou -1 (jours de semaine lun-ven)
ALTER TABLE recurring_unavailability DROP CONSTRAINT IF EXISTS recurring_unavailability_day_of_week_check;
ALTER TABLE recurring_unavailability ALTER COLUMN day_of_week DROP NOT NULL;
ALTER TABLE recurring_unavailability ADD CONSTRAINT recurring_unavailability_day_of_week_check
  CHECK (day_of_week IS NULL OR day_of_week BETWEEN -1 AND 6);
-- NULL = tous les jours, -1 = lun-ven, 0-6 = jour spécifique

-- Buffer avant les créneaux confirmés (temps de route)
ALTER TABLE intervenants ADD COLUMN IF NOT EXISTS buffer_before_minutes INT DEFAULT 0;
