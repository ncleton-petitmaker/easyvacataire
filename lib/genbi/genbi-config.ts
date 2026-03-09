/**
 * Configuration GenBI — description du schéma et exemples SQL
 * pour la génération de requêtes en langage naturel.
 */

export const GENBI_SCHEMA = `
-- Tables disponibles pour les requêtes GenBI :

CREATE TABLE intervenants (
  id UUID PRIMARY KEY,
  etablissement_id UUID,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  specialite TEXT,
  role TEXT, -- 'intervenant' | 'admin'
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
);

CREATE TABLE creneaux (
  id UUID PRIMARY KEY,
  besoin_id UUID,
  intervenant_id UUID REFERENCES intervenants(id),
  matiere_id UUID REFERENCES matieres(id),
  etablissement_id UUID,
  date DATE,
  heure_debut TIME,
  heure_fin TIME,
  salle TEXT,
  session_type TEXT, -- 'CM' | 'TD' | 'TP'
  status TEXT, -- 'confirme' | 'annule' | 'modifie'
  payment_status TEXT, -- 'non_paye' | 'paye'
  created_at TIMESTAMPTZ
);

CREATE TABLE disponibilites_intervenant (
  id UUID PRIMARY KEY,
  intervenant_id UUID REFERENCES intervenants(id),
  date DATE,
  heure_debut TIME,
  heure_fin TIME,
  source TEXT, -- 'web' | 'whatsapp'
  created_at TIMESTAMPTZ
);

CREATE TABLE besoins_etablissement (
  id UUID PRIMARY KEY,
  etablissement_id UUID,
  matiere_id UUID REFERENCES matieres(id),
  date DATE,
  heure_debut TIME,
  heure_fin TIME,
  salle TEXT,
  notes TEXT,
  session_type TEXT, -- 'CM' | 'TD' | 'TP'
  status TEXT, -- 'ouvert' | 'attribue' | 'annule'
  created_at TIMESTAMPTZ
);

CREATE TABLE matieres (
  id UUID PRIMARY KEY,
  etablissement_id UUID,
  code TEXT,
  name TEXT,
  volume_horaire_total INTEGER, -- en minutes
  description TEXT,
  created_at TIMESTAMPTZ
);
`;

export const GENBI_SQL_EXAMPLES = `
-- Exemples de requêtes SQL valides :

-- Combien de créneaux cette semaine ?
SELECT COUNT(*) as nb_creneaux
FROM creneaux
WHERE etablissement_id = '{etab_id}'
  AND date >= date_trunc('week', CURRENT_DATE)
  AND date < date_trunc('week', CURRENT_DATE) + interval '7 days'
  AND status = 'confirme';

-- Quels intervenants sont disponibles mardi prochain ?
SELECT DISTINCT i.first_name, i.last_name, d.heure_debut, d.heure_fin
FROM disponibilites_intervenant d
JOIN intervenants i ON i.id = d.intervenant_id
WHERE i.etablissement_id = '{etab_id}'
  AND d.date = CURRENT_DATE + ((2 - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7) * interval '1 day'
ORDER BY d.heure_debut;

-- Répartition des cours par matière
SELECT m.name as matiere, COUNT(*) as nb_cours
FROM creneaux c
JOIN matieres m ON m.id = c.matiere_id
WHERE c.etablissement_id = '{etab_id}'
  AND c.status = 'confirme'
GROUP BY m.name
ORDER BY nb_cours DESC;

-- Besoins non attribués
SELECT b.date, b.heure_debut, b.heure_fin, b.salle, m.name as matiere, b.session_type
FROM besoins_etablissement b
LEFT JOIN matieres m ON m.id = b.matiere_id
WHERE b.etablissement_id = '{etab_id}'
  AND b.status = 'ouvert'
ORDER BY b.date, b.heure_debut;

-- Heures effectuées par un intervenant sur un mois
SELECT SUM(EXTRACT(EPOCH FROM (heure_fin - heure_debut)) / 3600) as heures
FROM creneaux
WHERE etablissement_id = '{etab_id}'
  AND intervenant_id = '{intervenant_id}'
  AND date >= '2026-03-01' AND date < '2026-04-01'
  AND status = 'confirme';
`;

export const INTENT_DETECT_PROMPT = `Tu es un classifieur d'intention. Détermine si la question de l'utilisateur nécessite une requête base de données (GenBI) ou non.

Réponds UNIQUEMENT par un JSON : {"intent": "genbi_search" | "genbi_stats" | "none", "confidence": 0.0-1.0}

- genbi_search : l'utilisateur cherche des données spécifiques (quels intervenants, quels cours, quels besoins...)
- genbi_stats : l'utilisateur demande des statistiques, des comptages, des répartitions, des sommes
- none : salutations, questions pratiques, gestion de dispos, demande de planning personnel

Exemples :
- "Combien de créneaux cette semaine ?" → {"intent": "genbi_stats", "confidence": 0.95}
- "Quels intervenants enseignent le droit ?" → {"intent": "genbi_search", "confidence": 0.90}
- "Mon planning" → {"intent": "none", "confidence": 0.95}
- "Je suis libre mardi" → {"intent": "none", "confidence": 0.95}
- "Bonjour" → {"intent": "none", "confidence": 0.99}
- "Répartition des cours par matière" → {"intent": "genbi_stats", "confidence": 0.92}
- "Quels besoins ne sont pas couverts ?" → {"intent": "genbi_search", "confidence": 0.88}`;

export const SQL_GEN_SYSTEM_PROMPT = `Tu es un expert SQL PostgreSQL. Génère une requête SELECT pour répondre à la question de l'utilisateur.

SCHÉMA DE LA BASE :
${GENBI_SCHEMA}

RÈGLES STRICTES :
1. UNIQUEMENT des requêtes SELECT (pas d'INSERT, UPDATE, DELETE, DROP, etc.)
2. TOUJOURS filtrer par etablissement_id = '{etab_id}' sur les tables qui ont cette colonne
3. Pour disponibilites_intervenant, joindre avec intervenants pour filtrer par etablissement_id
4. Utilise CURRENT_DATE pour les dates relatives
5. Limite à 50 lignes maximum (LIMIT 50)
6. Utilise des alias lisibles pour les colonnes
7. Retourne UNIQUEMENT le SQL, sans explication, sans markdown

EXEMPLES :
${GENBI_SQL_EXAMPLES}

IMPORTANT : La date d'aujourd'hui est ${new Date().toISOString().split("T")[0]}.`;
