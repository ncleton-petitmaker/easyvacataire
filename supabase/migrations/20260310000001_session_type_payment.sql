-- Ajout du type de session (CM/TD/TP) et du suivi de paiement
ALTER TABLE besoins_etablissement ADD COLUMN session_type TEXT DEFAULT 'TD' CHECK (session_type IN ('CM','TD','TP'));
ALTER TABLE creneaux ADD COLUMN session_type TEXT DEFAULT 'TD' CHECK (session_type IN ('CM','TD','TP'));
ALTER TABLE creneaux ADD COLUMN payment_status TEXT DEFAULT 'non_paye' CHECK (payment_status IN ('non_paye','paye'));
