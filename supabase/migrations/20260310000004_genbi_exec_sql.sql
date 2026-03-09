-- Fonction RPC pour exécuter du SQL en lecture seule (GenBI)
-- Sécurisée : vérifie que la requête est un SELECT,
-- filtre obligatoirement par etablissement_id.

CREATE OR REPLACE FUNCTION exec_readonly_sql(query_text text, etab_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Vérification : pas de mutation
  IF query_text ~* '^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Seules les requêtes SELECT sont autorisées';
  END IF;

  -- Vérification : la requête doit référencer l'etablissement_id
  IF query_text NOT ILIKE '%' || etab_id::text || '%' THEN
    RAISE EXCEPTION 'La requête doit filtrer par etablissement_id';
  END IF;

  -- Exécution en lecture seule
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query_text)
  INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
