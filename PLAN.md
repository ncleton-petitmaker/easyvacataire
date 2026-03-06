# ToolIntervenantUniv - Plan d'architecture

## Vision

Outil de gestion des intervenants occasionnels en universite. Les intervenants ont peu d'heures, oublient leurs creneaux, subissent des changements de salles. Le systeme permet :

1. **Matching de disponibilites** entre intervenants et etablissements
2. **Base de connaissances RAG** (infos campus, procedures admin, pedagogie, FAQ)
3. **Bot WhatsApp** pour interaction naturelle (planning, questions, disponibilites)
4. **Dashboard web** pour admin et intervenants

---

## Stack technique

| Composant | Techno |
|-----------|--------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Base de donnees | Supabase (PostgreSQL + pgvector) |
| Auth | OTP WhatsApp via Evolution API + Supabase Auth |
| WhatsApp | Evolution API (self-hosted) |
| LLM/Embeddings | Mistral (embeddings + chat) |
| Cron/Rappels | Supabase Edge Functions ou Next.js cron (Vercel) |
| Deploiement | Docker (Coolify) |

Patterns repris de `marcelle-app` : Evolution client, RAG pipeline, OTP auth, embedding pipeline.

---

## Architecture des modules

### Module 1 : Auth OTP WhatsApp

**Repris de marcelle-app** avec adaptation au contexte universite.

- `POST /api/auth/request-otp` : valide le telephone, genere un code 6 chiffres, hash bcrypt, envoie via Evolution
- `POST /api/auth/verify-otp` : verifie le code, cree/retrouve l'utilisateur Supabase, retourne les tokens
- `lib/auth/phone-email.ts` : mapping `+33612345678` -> `wa_33612345678@univ.internal`
- `lib/whatsapp/send-otp.ts` : envoi du code via Evolution API

**Roles** :
- `admin` : gestionnaire de l'etablissement/composante
- `intervenant` : intervenant exterieur

### Module 2 : Schema Supabase

```sql
-- Etablissements / composantes
CREATE TABLE etablissements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  evolution_instance_name TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intervenants
CREATE TABLE intervenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID REFERENCES etablissements(id),
  user_id UUID REFERENCES auth.users(id),
  phone TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  specialite TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matieres / modules
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
  intervenant_id UUID REFERENCES intervenants(id),
  date DATE NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  source TEXT DEFAULT 'web', -- 'web' | 'whatsapp'
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- Historique des changements (salle, horaire)
CREATE TABLE creneaux_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creneau_id UUID REFERENCES creneaux(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Base de connaissances
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID REFERENCES etablissements(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- 'campus' | 'admin' | 'pedagogie' | 'faq'
  source_type TEXT DEFAULT 'text', -- 'text' | 'pdf' | 'video'
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Embeddings pour RAG
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

-- Index HNSW pour recherche vectorielle
CREATE INDEX ON knowledge_embeddings
  USING hnsw (embedding vector_cosine_ops);

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
  conversation_id UUID REFERENCES conversations(id),
  direction TEXT NOT NULL, -- 'inbound' | 'outbound'
  content TEXT,
  message_type TEXT DEFAULT 'text',
  whatsapp_message_id TEXT,
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

-- Fonction de matching vectoriel
CREATE FUNCTION match_knowledge(
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
```

### Module 3 : Evolution API (WhatsApp)

**Fichiers** (repris et adaptes de marcelle-app) :

- `lib/whatsapp/evolution.ts` : client Evolution (sendText, sendImage, sendTyping)
- `lib/whatsapp/evolution-media.ts` : envoi de medias
- `lib/whatsapp/send-otp.ts` : envoi OTP
- `app/api/whatsapp-webhook/route.ts` : reception des messages entrants

**Webhook flow** :
```
Message WhatsApp entrant
  -> Deduplication (30s TTL)
  -> Identification intervenant par phone
  -> Si pas connu : proposition d'inscription
  -> Si connu : routage vers le chat-agent
```

**Commandes naturelles reconnues par le bot** :
- "Mon planning" / "Mes prochains cours" -> affiche les creneaux a venir
- "Je suis dispo le..." -> enregistre une disponibilite
- "Ou est la salle X ?" -> recherche RAG
- "Comment faire pour les feuilles d'emargement ?" -> recherche RAG
- "Mes dispos" -> lien vers le calendrier web

### Module 4 : Systeme de disponibilites et matching

#### 4a. Saisie des disponibilites (intervenant)

**Via WhatsApp (conversationnel)** :
- L'intervenant dit "je suis libre mardi et jeudi apres-midi en mars"
- Le bot parse avec le LLM, extrait les creneaux, confirme
- Stocke dans `disponibilites_intervenant` avec `source='whatsapp'`

**Via lien web (calendrier custom)** :
- Le bot envoie un lien : `https://app.../dispos/{token}`
- Page calendrier custom (composant React)
- Vue mensuelle, l'intervenant clique/glisse pour selectionner ses plages
- Sauvegarde dans `disponibilites_intervenant` avec `source='web'`

#### 4b. Besoins de l'etablissement

**Via dashboard admin** :
- Saisie manuelle des creneaux a pourvoir (date, horaire, matiere, salle)
- Import CSV/Excel : colonnes `date, heure_debut, heure_fin, matiere, salle`
- Stocke dans `besoins_etablissement`

**Via calendrier web** :
- Meme composant calendrier que les intervenants
- L'admin selectionne les plages de besoin

#### 4c. Matching et visualisation

**Algorithme de matching** :
```typescript
// Pour chaque besoin ouvert, trouver les intervenants disponibles
function findMatches(etablissementId: string) {
  // 1. Recuperer tous les besoins 'ouvert'
  // 2. Pour chaque besoin, chercher les disponibilites qui chevauchent
  // 3. Filtrer par specialite/matiere si applicable
  // 4. Retourner les paires {besoin, intervenant, overlap}
}
```

**Visualisation (dashboard)** :
- Vue split-screen : besoins a gauche, dispos a droite
- Animation de "match" quand un creneau correspond (style Tinder/confetti)
- L'admin clique pour confirmer -> cree un `creneau` confirme
- Notification WhatsApp automatique a l'intervenant

### Module 5 : RAG (Base de connaissances)

**Repris de marcelle-app** avec simplification (pas de scope public/internal, un seul scope).

- `lib/embeddings/embed.ts` : pipeline d'embedding (chunking + Mistral embed)
- `lib/embeddings/chunker.ts` : decoupe en chunks (500 chars, overlap 100)
- `lib/ai/rag.ts` : recherche semantique via `match_knowledge()`
- `app/api/embed-entry/route.ts` : endpoint pour indexer une entree

**Categories** :
- `campus` : plans, acces, parking, WiFi, badges, contacts
- `admin` : emargement, notes, conventions, facturation
- `pedagogie` : maquettes, syllabus, evaluations
- `faq` : documents divers uploades

**Dashboard admin** :
- CRUD des entrees knowledge_base
- Upload de fichiers (PDF, texte)
- Re-indexation manuelle ou auto a la creation

### Module 6 : Chat Agent (LLM)

- `app/api/chat-agent/route.ts` : agent Mistral avec outils
- `lib/ai/mistral.ts` : client Mistral
- `lib/ai/system-prompt.ts` : prompt systeme contextualise

**Outils disponibles pour le LLM** :
```typescript
tools = [
  searchKnowledge(query),         // RAG search
  getMyPlanning(intervenantId),   // Prochains creneaux
  addDisponibilite(date, debut, fin), // Ajouter une dispo
  getDisponibiliteLink(),         // Generer lien calendrier
  getInfoSalle(salle),           // Info sur une salle
]
```

### Module 7 : Dashboard Web

**Pages admin** (`/admin/...`) :
- `/admin/intervenants` : liste, ajout, import des intervenants
- `/admin/matieres` : gestion des modules/matieres
- `/admin/besoins` : calendrier des besoins + import CSV
- `/admin/matching` : vue matching avec animation
- `/admin/creneaux` : planning confirme (vue calendrier)
- `/admin/knowledge` : gestion base de connaissances
- `/admin/conversations` : historique des conversations WhatsApp

**Pages intervenant** (`/mes/...`) :
- `/mes/creneaux` : mon planning (vue calendrier)
- `/mes/disponibilites` : calendrier de saisie des dispos
- `/mes/infos` : infos pratiques (recherche dans la KB)

**Page publique** :
- `/dispos/{token}` : saisie des disponibilites (lien envoye par WhatsApp, sans auth)

### Module 8 : Rappels automatiques

- **Cron job** (Supabase Edge Function ou Vercel Cron) execute quotidiennement
- Rappel J-7 : "Vous avez cours la semaine prochaine : [resume]"
- Rappel J-1 : "Rappel : demain [matiere] de [heure] a [heure], salle [salle]"
- Rappel J-0 matin : "Aujourd'hui [matiere] a [heure], salle [salle]. Bon cours !"
- Notification immediate si changement de salle/horaire (via `creneaux_changelog` trigger)

---

## Structure du projet

```
toolintervenantuniv/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing / login
│   ├── api/
│   │   ├── auth/
│   │   │   ├── request-otp/route.ts
│   │   │   └── verify-otp/route.ts
│   │   ├── whatsapp-webhook/route.ts
│   │   ├── chat-agent/route.ts
│   │   ├── embed-entry/route.ts
│   │   ├── creneaux/route.ts
│   │   ├── disponibilites/route.ts
│   │   ├── besoins/route.ts
│   │   ├── matching/route.ts
│   │   ├── import/route.ts          # Import CSV/Excel
│   │   └── knowledge/route.ts
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── intervenants/page.tsx
│   │   ├── matieres/page.tsx
│   │   ├── besoins/page.tsx
│   │   ├── matching/page.tsx
│   │   ├── creneaux/page.tsx
│   │   ├── knowledge/page.tsx
│   │   └── conversations/page.tsx
│   ├── mes/
│   │   ├── layout.tsx
│   │   ├── creneaux/page.tsx
│   │   ├── disponibilites/page.tsx
│   │   └── infos/page.tsx
│   └── dispos/
│       └── [token]/page.tsx         # Lien public calendrier
├── components/
│   ├── ui/                          # shadcn/ui
│   ├── calendar/
│   │   ├── availability-calendar.tsx # Composant calendrier custom
│   │   ├── planning-view.tsx
│   │   └── match-animation.tsx      # Animation de matching
│   ├── import/
│   │   └── csv-importer.tsx
│   └── knowledge/
│       └── knowledge-editor.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── whatsapp/
│   │   ├── evolution.ts
│   │   ├── send-otp.ts
│   │   └── evolution-media.ts
│   ├── auth/
│   │   └── phone-email.ts
│   ├── ai/
│   │   ├── mistral.ts
│   │   ├── rag.ts
│   │   ├── system-prompt.ts
│   │   └── tools.ts
│   ├── embeddings/
│   │   ├── embed.ts
│   │   └── chunker.ts
│   ├── matching/
│   │   └── engine.ts                # Algorithme de matching
│   └── import/
│       └── csv-parser.ts
├── supabase/
│   └── migrations/
│       ├── 001_base_schema.sql
│       ├── 002_knowledge_embeddings.sql
│       └── 003_rls_policies.sql
├── templates/
│   └── system-prompt.md
├── docker-compose.yml               # Evolution API
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.example
```

---

## Ordre d'implementation

### Phase 1 : Fondations (Semaine 1)
1. Init Next.js + Supabase + Tailwind + shadcn/ui
2. Schema Supabase (migrations)
3. Auth OTP WhatsApp (repris de marcelle-app)
4. Evolution API client (repris de marcelle-app)
5. Docker compose pour Evolution

### Phase 2 : Planning de base (Semaine 2)
6. CRUD intervenants (dashboard admin)
7. CRUD matieres
8. CRUD besoins (saisie manuelle)
9. Import CSV/Excel des besoins
10. Vue planning confirme (calendrier)

### Phase 3 : Disponibilites et matching (Semaine 3)
11. Composant calendrier custom (selection de plages)
12. Page publique `/dispos/[token]` (saisie dispos sans auth)
13. Saisie des disponibilites intervenant (web)
14. Saisie des besoins etablissement (calendrier)
15. Algorithme de matching
16. Vue matching avec animation

### Phase 4 : WhatsApp Bot (Semaine 4)
17. Webhook WhatsApp
18. Chat agent avec outils (planning, dispos)
19. Saisie conversationnelle des disponibilites
20. Envoi du lien calendrier via WhatsApp
21. Notifications de changements

### Phase 5 : RAG (Semaine 5)
22. Pipeline d'embedding (repris de marcelle-app)
23. CRUD knowledge base (dashboard)
24. Recherche RAG integree au chat agent
25. Upload de documents (PDF)

### Phase 6 : Rappels et polish (Semaine 6)
26. Cron de rappels (J-7, J-1, J-0)
27. Triggers sur changement de salle/horaire
28. Dashboard intervenant (mes creneaux, mes dispos, infos)
29. Tests et ajustements

---

## Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=univ-bot

# Mistral
MISTRAL_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
