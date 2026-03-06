-- Base de connaissances
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID REFERENCES etablissements(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- 'campus' | 'admin' | 'pedagogie' | 'faq'
  source_type TEXT DEFAULT 'text', -- 'text' | 'pdf'
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Embeddings pour recherche vectorielle RAG
CREATE TABLE knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id UUID REFERENCES knowledge_base(id) ON DELETE CASCADE,
  etablissement_id UUID REFERENCES etablissements(id),
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,
  embedding VECTOR(1024),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index HNSW pour recherche rapide
CREATE INDEX idx_knowledge_embeddings_hnsw
  ON knowledge_embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_knowledge_embeddings_etab
  ON knowledge_embeddings(etablissement_id);

-- Fonction de recherche vectorielle
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(1024),
  match_threshold FLOAT DEFAULT 0.50,
  match_count INT DEFAULT 5,
  filter_etablissement UUID DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  knowledge_id UUID,
  chunk_text TEXT,
  similarity FLOAT
) LANGUAGE sql STABLE AS $$
  SELECT
    ke.id,
    ke.knowledge_id,
    ke.chunk_text,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings ke
  WHERE (filter_etablissement IS NULL OR ke.etablissement_id = filter_etablissement)
    AND 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
$$;
