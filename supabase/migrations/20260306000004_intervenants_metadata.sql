-- Add metadata column for dispo tokens etc.
ALTER TABLE intervenants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
