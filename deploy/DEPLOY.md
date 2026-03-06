# Déploiement EasyVacataire sur VPS

## Coût estimé

| Service | Fournisseur recommandé | Coût |
|---|---|---|
| **VPS** (8 Go RAM, 4 vCPU) | [OVH VPS](https://www.ovhcloud.com/fr/vps/) ou [Hetzner](https://www.hetzner.com/cloud/) | ~8–12 €/mois |
| **Evolution API** (WhatsApp) | [Evolution API Free Plan](https://evolution-api.com/) — abonnement recommandé | ~2 €/mois |
| **Mistral AI** | [Mistral](https://console.mistral.ai/) — pay-as-you-go | ~1–5 €/mois selon usage |
| **Domaine** | OVH, Cloudflare, etc. | ~5–10 €/an |
| **Total** | | **~12–20 €/mois** |

> **Pourquoi 8 Go de RAM ?** L'application Next.js, Supabase (PostgreSQL + Auth + REST + Kong), Evolution API et leurs bases de données tournent tous sur le même serveur. Avec 4 Go ça passe en dev/test, mais **8 Go est le minimum recommandé en production** pour que tout soit confortable.

> **Evolution API Free Plan à 2 €/mois** : Ce plan inclut une instance WhatsApp, suffisant pour un établissement. Il offre un support communautaire et des mises à jour automatiques. C'est le meilleur rapport qualité-prix pour démarrer.

## Architecture VPS

```
VPS (Ubuntu 22.04+)
├── Coolify (port 8000) — deploie l'app Next.js depuis git
├── docker-compose.infra.yml — infrastructure (Supabase + Evolution)
│   ├── supabase-db       (PostgreSQL 15 + pgvector, port 5432 interne)
│   ├── supabase-auth     (GoTrue, port 9999 interne)
│   ├── supabase-rest     (PostgREST, port 3000 interne)
│   ├── supabase-kong     (API Gateway, port 8443 local)
│   ├── supabase-studio   (Dashboard DB, port 3100 local)
│   ├── supabase-meta     (Postgres Meta, interne)
│   ├── evolution         (WhatsApp API, port 8080 local)
│   └── evolution-db      (PostgreSQL Evolution, interne)
└── Next.js app (container gere par Coolify, port 3000)
    └── reseau Docker "univ" — communique avec tous les services
```

Tous les services internes écoutent sur 127.0.0.1 uniquement.
Coolify gère le reverse proxy (Traefik) + SSL Let's Encrypt.

## Prérequis

1. VPS Ubuntu 22.04+ avec **minimum 8 Go RAM**, 4 vCPU (OVH ou Hetzner recommandé)
2. Docker + Docker Compose installés
3. Coolify installé : `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`
4. Domaine pointé vers l'IP du VPS (A record)
5. Abonnement [Evolution API Free](https://evolution-api.com/) (~2 €/mois) pour WhatsApp

## Étape 1 : Infrastructure

```bash
# Sur le VPS, cloner le repo
git clone <votre-repo> /opt/uniplanning-repo
cd /opt/uniplanning-repo/deploy

# Copier et éditer le .env
cp .env.example /opt/uniplanning/.env
nano /opt/uniplanning/.env
# → Remplir: DOMAIN, POSTGRES_PASSWORD, JWT_SECRET, EVOLUTION_API_KEY, etc.

# Lancer le setup
bash setup-vps.sh
```

Le script va :
- Copier les fichiers d'infra dans /opt/uniplanning
- Générer les JWT Supabase (anon + service_role)
- Démarrer tous les containers Docker
- Appliquer les migrations SQL

## Étape 2 : Coolify — Déployer l'app Next.js

1. Ouvrir Coolify (https://votre-vps:8000)
2. Creer un nouveau projet "EasyVacataire"
3. Ajouter une ressource → **Public Repository** (ou privé si besoin)
4. URL du repo git
5. Configuration:
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: ./Dockerfile
   - **Port expose**: 3000

6. **Variables d'environnement** (onglet Environment):
   ```
   # Build args (NEXT_PUBLIC_)
   NEXT_PUBLIC_SUPABASE_URL=https://votre-domaine.com
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key_generee>
   NEXT_PUBLIC_APP_URL=https://votre-domaine.com

   # Runtime env
   SUPABASE_SERVICE_ROLE_KEY=<service_role_key_generee>
   EVOLUTION_API_URL=http://univ-evolution:8080
   EVOLUTION_API_KEY=<votre_cle>
   EVOLUTION_INSTANCE=univ-bot
   MISTRAL_API_KEY=<votre_cle>
   ```

7. **Reseau Docker** (onglet Advanced → Custom Docker Options):
   ```
   --network=univ
   ```
   Cela permet au container Next.js de joindre `supabase-db`, `supabase-auth`,
   `supabase-rest`, `supabase-kong`, `evolution` par leur nom de conteneur.

8. **Domaine** (onglet Domains):
   - Ajouter `votre-domaine.com`
   - Activer SSL (Let's Encrypt automatique via Coolify/Traefik)

9. **Deploy** → Coolify build le Dockerfile et lance le conteneur.

## Étape 3 : Configurer Evolution

Après le premier déploiement :

```bash
# Creer l'instance WhatsApp
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: VOTRE_EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "univ-bot",
    "integration": "WHATSAPP-BAILEYS",
    "webhook": {
      "url": "https://votre-domaine.com/api/whatsapp-webhook",
      "events": ["MESSAGES_UPSERT"],
      "enabled": true
    }
  }'

# Scanner le QR code pour connecter WhatsApp
# Ouvrir: http://localhost:8080/instance/connect/univ-bot
```

## Étape 4 : Créer le premier établissement + admin

```bash
# Se connecter à la DB
docker exec -it univ-supabase-db psql -U postgres -d postgres

# Créer l'établissement
INSERT INTO etablissements (name, slug, evolution_instance_name)
VALUES ('Mon Universite', 'mon-univ', 'univ-bot');

# Créer l'admin (remplacer le téléphone)
INSERT INTO intervenants (etablissement_id, phone, first_name, last_name, role)
VALUES (
  (SELECT id FROM etablissements WHERE slug = 'mon-univ'),
  '+33612345678',
  'Admin',
  'EasyVacataire',
  'admin'
);
```

## Accès

| Service | URL |
|---------|-----|
| App Next.js | https://votre-domaine.com |
| Supabase Studio | http://VPS_IP:3100 (proteger par firewall) |
| Evolution API | http://VPS_IP:8080 (proteger par firewall) |
| Coolify | http://VPS_IP:8000 |

## Sécurité

- Supabase Studio (3100) et Evolution (8080) écoutent sur 127.0.0.1
- Utilisez un tunnel SSH pour y accéder : `ssh -L 3100:127.0.0.1:3100 user@vps`
- Seuls les ports 80/443 (Traefik via Coolify) et 8000 (Coolify) sont exposés publiquement
- Changez tous les mots de passe par défaut dans le .env

## Mises à jour

L'app Next.js se met à jour automatiquement via Coolify (push git → redeploy).

Pour mettre à jour l'infrastructure :
```bash
cd /opt/uniplanning
docker compose -f docker-compose.infra.yml --env-file .env pull
docker compose -f docker-compose.infra.yml --env-file .env up -d
```
