<div align="center">

# EasyVacataire

**La plateforme open source de gestion des intervenants vacataires en université.**

Matching de disponibilités, bot WhatsApp intelligent, base de connaissances RAG et dashboard d'administration — le tout dans une seule application.

[![License](https://img.shields.io/github/license/ncleton-petitmaker/easyvacataire?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/ncleton-petitmaker/easyvacataire?style=for-the-badge)](https://github.com/ncleton-petitmaker/easyvacataire/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/ncleton-petitmaker/easyvacataire?style=for-the-badge)](https://github.com/ncleton-petitmaker/easyvacataire/issues)
[![Last Commit](https://img.shields.io/github/last-commit/ncleton-petitmaker/easyvacataire?style=for-the-badge)](https://github.com/ncleton-petitmaker/easyvacataire/commits/main)

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](#stack-technique)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](#stack-technique)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#stack-technique)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](#stack-technique)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#stack-technique)
[![WhatsApp](https://img.shields.io/badge/WhatsApp_Bot-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](#module-3--bot-whatsapp)

</div>

---

## Le problème

Les universités françaises font massivement appel à des **intervenants vacataires** — des professionnels extérieurs qui assurent quelques heures de cours. Ces vacataires :

- **Oublient leurs créneaux** car ils jonglent entre plusieurs emplois
- **Subissent des changements de salle** de dernière minute sans en être informés
- **Ne connaissent pas le campus** (WiFi, parking, émargement, contacts)
- **Communiquent par email** avec des temps de réponse longs et des informations perdues

Côté administration, les **gestionnaires de scolarité** passent des heures à :

- Croiser manuellement les disponibilités des vacataires avec les besoins
- Relancer les intervenants par email ou téléphone
- Répondre aux mêmes questions pratiques encore et encore

---

## La solution

EasyVacataire automatise la gestion des vacataires grâce à **3 piliers** :

### 1. Matching intelligent des disponibilités

Les vacataires déclarent leurs disponibilités via WhatsApp ou un calendrier web. L'algorithme matche automatiquement les créneaux disponibles avec les besoins de l'établissement.

### 2. Bot WhatsApp conversationnel

Un assistant IA accessible sur WhatsApp qui permet aux vacataires de :
- Consulter leur planning en langage naturel (*"Mes prochains cours ?"*)
- Déclarer leurs disponibilités (*"Je suis libre mardi et jeudi après-midi"*)
- Poser des questions pratiques (*"Où est la salle B204 ?"*)

### 3. Base de connaissances RAG

Les infos pratiques du campus (plans, procédures, FAQ) sont indexées et consultables par les vacataires via le bot WhatsApp. Fini les mêmes questions répétées au secrétariat.

---

<details>
<summary><h2>Table des matières</h2></summary>

- [Le problème](#le-problème)
- [La solution](#la-solution)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Variables d'environnement](#variables-denvironnement)
- [Structure du projet](#structure-du-projet)
- [Modules en détail](#modules-en-détail)
  - [Module 1 : Authentification OTP WhatsApp](#module-1--authentification-otp-whatsapp)
  - [Module 2 : Gestion des disponibilités et matching](#module-2--gestion-des-disponibilités-et-matching)
  - [Module 3 : Bot WhatsApp](#module-3--bot-whatsapp)
  - [Module 4 : Base de connaissances RAG](#module-4--base-de-connaissances-rag)
  - [Module 5 : Dashboard d'administration](#module-5--dashboard-dadministration)
  - [Module 6 : Rappels automatiques](#module-6--rappels-automatiques)
- [Déploiement](#déploiement)
- [Schéma de la base de données](#schéma-de-la-base-de-données)
- [Feuille de route](#feuille-de-route)
- [Contribuer](#contribuer)
- [Licence](#licence)
- [Contact](#contact)

</details>

---

## Fonctionnalités

| Fonctionnalité | Description | Status |
|---|---|---|
| **Auth OTP WhatsApp** | Connexion par code à 6 chiffres envoyé sur WhatsApp | Done |
| **CRUD Intervenants** | Gestion complète des vacataires (ajout, import, activation) | Done |
| **CRUD Matières** | Gestion des modules et matières d'enseignement | Done |
| **Saisie des besoins** | Calendrier + import CSV des créneaux à pourvoir | Done |
| **Disponibilités web** | Calendrier interactif de sélection de plages horaires | Done |
| **Disponibilités WhatsApp** | Saisie conversationnelle via le bot | Done |
| **Lien public dispos** | Lien sans auth pour saisir ses dispos (envoyé par WhatsApp) | Done |
| **Algorithme de matching** | Croisement automatique besoins / disponibilités | Done |
| **Vue matching** | Interface visuelle split-screen avec animation | Done |
| **Bot WhatsApp** | Agent conversationnel avec outils (planning, dispos, RAG) | Done |
| **Base de connaissances** | CRUD + upload de documents + indexation vectorielle | Done |
| **Recherche RAG** | Recherche sémantique dans la base de connaissances | Done |
| **Rappels automatiques** | Notifications J-7, J-1, J-0 par WhatsApp | Done |
| **Dashboard intervenant** | Planning, disponibilités, infos pratiques | Done |
| **Dashboard admin** | Vue complète : intervenants, besoins, matching, conversations | Done |
| **Multi-établissement** | Architecture multi-tenant par établissement | Done |
| **Déploiement Docker** | Dockerfile multi-stage optimisé pour la production | Done |

---

## Stack technique

| Composant | Technologie | Pourquoi ce choix |
|---|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router) | SSR, API routes, performances |
| **Langage** | [TypeScript](https://www.typescriptlang.org/) | Typage fort, DX, maintenabilité |
| **UI** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Utility-first, rapide à itérer |
| **Base de données** | [Supabase](https://supabase.com/) (PostgreSQL + pgvector) | BDD relationnelle + recherche vectorielle + auth + temps réel |
| **Auth** | OTP WhatsApp via [Evolution API](https://doc.evolution-api.com/) | Authentification naturelle pour les utilisateurs WhatsApp |
| **WhatsApp** | [Evolution API](https://doc.evolution-api.com/) (self-hosted) | API WhatsApp open source, multi-instance |
| **LLM** | [Mistral AI](https://mistral.ai/) | Embeddings + chat, performant en français |
| **Déploiement** | [Docker](https://www.docker.com/) | Conteneurisation, reproductibilité |

---

## Architecture

```
                                    +------------------+
                                    |   Intervenant    |
                                    |   (WhatsApp)     |
                                    +--------+---------+
                                             |
                                    Messages WhatsApp
                                             |
                                             v
+------------------+           +------------------+           +------------------+
|   Evolution API  | <-------> |   Next.js App    | <-------> |    Supabase      |
|   (WhatsApp)     |  webhook  |   (API Routes)   |  client   |  (PostgreSQL +   |
|   self-hosted    |           |                  |           |   pgvector)      |
+------------------+           +--------+---------+           +------------------+
                                        |
                              +---------+---------+
                              |                   |
                              v                   v
                    +------------------+  +------------------+
                    |   Dashboard      |  |   Mistral AI     |
                    |   Admin / Interv. |  |   (LLM + Embed)  |
                    |   (React SSR)    |  |                  |
                    +------------------+  +------------------+
```

**Flux principal :**

1. L'intervenant envoie un message WhatsApp
2. Evolution API transmet le message au webhook Next.js
3. L'agent IA analyse le message, utilise ses outils (planning, dispos, RAG)
4. La réponse est envoyée à l'intervenant via Evolution API
5. Toutes les données sont persistées dans Supabase

---

## Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) >= 20.x
- [Docker](https://www.docker.com/) et Docker Compose
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- Un compte [Mistral AI](https://console.mistral.ai/) (pour le LLM et les embeddings)
- Un téléphone avec WhatsApp (pour scanner le QR code Evolution)

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/ncleton-petitmaker/easyvacataire.git
cd easyvacataire

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env.local

# 4. Démarrer Supabase en local
supabase start

# 5. Appliquer les migrations
supabase db push

# 6. Démarrer Evolution API (WhatsApp)
docker compose up -d

# 7. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

> **Note :** Au premier lancement, connectez-vous à l'interface Evolution API sur `http://localhost:8080` pour créer une instance et scanner le QR code WhatsApp.

### Variables d'environnement

Copiez `.env.example` en `.env.local` et renseignez les valeurs :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=changeme
EVOLUTION_INSTANCE=univ-bot

# Mistral AI
MISTRAL_API_KEY=your-mistral-api-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Important :** Ne commitez jamais vos vraies clés d'API. Le fichier `.env.local` est automatiquement ignoré par Git.

<details>
<summary><strong>Description détaillée de chaque variable</strong></summary>

| Variable | Description | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre instance Supabase | Oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (côté client) | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase (côté serveur, bypass RLS) | Oui |
| `EVOLUTION_API_URL` | URL de l'instance Evolution API | Oui |
| `EVOLUTION_API_KEY` | Clé d'authentification Evolution API | Oui |
| `EVOLUTION_INSTANCE` | Nom de l'instance WhatsApp dans Evolution | Oui |
| `MISTRAL_API_KEY` | Clé API Mistral pour le LLM et les embeddings | Non* |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application | Oui |

*\* Sans `MISTRAL_API_KEY`, le bot WhatsApp fonctionne en mode fallback (réponses par mots-clés, sans IA).*

</details>

---

## Structure du projet

```
easyvacataire/
│
├── app/                          # Next.js App Router
│   ├── (landing)/                # Landing page publique
│   ├── login/                    # Page de connexion OTP
│   ├── admin/                    # Dashboard administration
│   │   ├── intervenants/         # Gestion des vacataires
│   │   ├── matieres/             # Gestion des matières
│   │   ├── besoins/              # Besoins de l'établissement
│   │   ├── matching/             # Vue matching avec animation
│   │   ├── creneaux/             # Planning confirmé
│   │   ├── knowledge/            # Base de connaissances
│   │   └── conversations/        # Historique WhatsApp
│   ├── mes/                      # Dashboard intervenant
│   │   ├── creneaux/             # Mon planning
│   │   ├── disponibilites/       # Mes disponibilités
│   │   └── infos/                # Infos pratiques
│   ├── dispos/[token]/           # Lien public de disponibilités
│   └── api/
│       ├── auth/                 # OTP request + verify
│       ├── whatsapp-webhook/     # Webhook Evolution API
│       ├── chat-agent/           # Agent IA conversationnel
│       ├── intervenants/         # CRUD intervenants
│       ├── matieres/             # CRUD matières
│       ├── besoins/              # CRUD besoins
│       ├── creneaux/             # CRUD créneaux
│       ├── disponibilites/       # CRUD dispos + lien public
│       ├── matching/             # Algorithme de matching
│       ├── knowledge/            # CRUD + embed + search
│       ├── conversations/        # Historique messages
│       ├── import/               # Import CSV
│       └── cron/reminders/       # Rappels automatiques
│
├── components/
│   ├── landing/                  # Composants landing page
│   └── calendar/                 # Calendrier de disponibilités
│
├── lib/
│   ├── supabase/                 # Clients Supabase (server + client)
│   ├── whatsapp/                 # Client Evolution API
│   ├── auth/                     # Mapping phone → email
│   ├── ai/                       # Mistral client, RAG, agent tools
│   └── embeddings/               # Pipeline d'embedding + chunker
│
├── supabase/
│   └── migrations/               # Migrations SQL
│
├── docker-compose.yml            # Evolution API (dev local)
├── Dockerfile                    # Build de production multi-stage
└── middleware.ts                  # Auth middleware Next.js
```

---

## Modules en détail

### Module 1 : Authentification OTP WhatsApp

L'authentification se fait par **code OTP à 6 chiffres** envoyé via WhatsApp :

1. L'utilisateur entre son numéro de téléphone
2. Un code est généré, hashé (bcrypt) et stocké en base
3. Le code est envoyé via Evolution API sur WhatsApp
4. L'utilisateur saisit le code, qui est vérifié côté serveur
5. Un utilisateur Supabase Auth est créé ou retrouvé via un mapping `phone → email`

**Points de sécurité :**
- Codes expirés après 5 minutes
- Maximum 3 tentatives par code
- Hash bcrypt (pas de stockage en clair)
- Rate limiting sur les endpoints

### Module 2 : Gestion des disponibilités et matching

#### Saisie des disponibilités

Les vacataires peuvent déclarer leurs disponibilités de **3 façons** :

| Méthode | Description | Accès |
|---|---|---|
| **Calendrier web** | Interface drag-and-drop sur un calendrier mensuel | Connecté |
| **Lien public** | Lien unique sans authentification (envoyé par WhatsApp) | Sans auth |
| **WhatsApp** | Langage naturel : *"libre mardi et jeudi après-midi en mars"* | WhatsApp |

#### Algorithme de matching

Pour chaque besoin de l'établissement (`besoins_etablissement`), l'algorithme :

1. Recherche les disponibilités qui chevauchent le créneau
2. Filtre par spécialité/matière si applicable
3. Retourne les paires `{besoin, intervenant, overlap}`
4. L'admin confirme le match via l'interface

Le créneau confirmé est créé dans la table `creneaux` et une notification WhatsApp est envoyée au vacataire.

### Module 3 : Bot WhatsApp

Le bot utilise **Mistral AI** avec un système d'outils (function calling) :

| Outil | Description |
|---|---|
| `searchKnowledge(query)` | Recherche sémantique dans la base de connaissances |
| `getMyPlanning(intervenantId)` | Prochains créneaux confirmés |
| `addDisponibilite(date, debut, fin)` | Enregistrer une disponibilité |
| `getDisponibiliteLink()` | Générer un lien vers le calendrier web |
| `getInfoSalle(salle)` | Informations sur une salle |

**Mode fallback :** Sans clé API Mistral, le bot fonctionne par détection de mots-clés (planning, disponibilités, aide).

### Module 4 : Base de connaissances RAG

Pipeline complet de Retrieval-Augmented Generation :

1. **Ingestion** : L'admin ajoute des articles ou uploade des PDF
2. **Chunking** : Découpe en fragments de 500 caractères avec overlap de 100
3. **Embedding** : Vectorisation via Mistral Embed (dimension 1024)
4. **Stockage** : Vecteurs stockés dans PostgreSQL via pgvector (index HNSW)
5. **Recherche** : Recherche par similarité cosinus avec seuil configurable

**Catégories de connaissances :**
- `campus` : plans, accès, parking, WiFi, badges, contacts
- `admin` : émargement, notes, conventions, facturation
- `pedagogie` : maquettes, syllabus, évaluations
- `faq` : documents divers

### Module 5 : Dashboard d'administration

| Page | Description |
|---|---|
| `/admin/intervenants` | Liste, ajout, import, activation/désactivation |
| `/admin/matieres` | CRUD des modules d'enseignement |
| `/admin/besoins` | Calendrier des créneaux à pourvoir + import CSV |
| `/admin/matching` | Vue split-screen avec animation de matching |
| `/admin/creneaux` | Planning confirmé (vue calendrier) |
| `/admin/knowledge` | Gestion de la base de connaissances |
| `/admin/conversations` | Historique des conversations WhatsApp |

### Module 6 : Rappels automatiques

Cron job qui envoie des rappels par WhatsApp :

| Moment | Message |
|---|---|
| **J-7** | *"Vous avez cours la semaine prochaine : [résumé]"* |
| **J-1** | *"Rappel : demain [matière] de [heure] à [heure], salle [salle]"* |
| **J-0 matin** | *"Aujourd'hui [matière] à [heure], salle [salle]. Bon cours !"* |
| **Changement** | Notification immédiate si modification de salle ou d'horaire |

Les changements de créneaux sont détectés automatiquement via un trigger PostgreSQL qui alimente la table `creneaux_changelog`.

---

## Déploiement

### Docker (recommandé)

```bash
# Build de l'image
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg NEXT_PUBLIC_APP_URL=https://your-domain.com \
  -t easyvacataire .

# Lancer le conteneur
docker run -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  -e EVOLUTION_API_URL=http://your-evolution:8080 \
  -e EVOLUTION_API_KEY=your-key \
  -e MISTRAL_API_KEY=your-key \
  easyvacataire
```

### Coolify / VPS (recommandé pour la production)

> **Coût estimé : ~12–20 €/mois** — Un VPS [OVH](https://www.ovhcloud.com/fr/vps/) ou [Hetzner](https://www.hetzner.com/cloud/) avec **8 Go de RAM** (~8–12 €/mois) + un abonnement [Evolution API Free](https://evolution-api.com/) à **~2 €/mois** pour WhatsApp.

Le dossier `deploy/` contient les fichiers de configuration pour un déploiement sur VPS :

- `docker-compose.infra.yml` : Stack complète (app + Evolution API + base de données)
- `setup-vps.sh` : Script d'initialisation du serveur
- `kong.yml` : Configuration du reverse proxy

Consultez [`deploy/DEPLOY.md`](deploy/DEPLOY.md) pour les instructions détaillées.

---

## Schéma de la base de données

```
etablissements
  ├── intervenants
  ├── matieres
  ├── besoins_etablissement
  ├── creneaux
  │     └── creneaux_changelog
  ├── knowledge_base
  │     └── knowledge_embeddings
  └── conversations
        └── messages

otp_codes (indépendant)
disponibilites_intervenant (lié à intervenants)
```

Toutes les tables sont protégées par des **Row Level Security (RLS) policies**. Voir [`supabase/migrations/`](supabase/migrations/) pour le schéma complet.

---

## Feuille de route

- [x] Authentification OTP WhatsApp
- [x] CRUD intervenants, matières, besoins
- [x] Import CSV des besoins
- [x] Calendrier de disponibilités (web + lien public)
- [x] Algorithme de matching
- [x] Bot WhatsApp avec agent IA
- [x] Base de connaissances RAG
- [x] Rappels automatiques
- [x] Dashboard admin et intervenant
- [x] Déploiement Docker
- [ ] Support multi-langue (EN, ES)
- [ ] Application mobile (React Native)
- [ ] Intégration calendrier externe (Google Calendar, Outlook)
- [ ] Notifications email en complément de WhatsApp
- [ ] Tableau de bord analytique (statistiques d'utilisation)
- [ ] API publique documentée (OpenAPI/Swagger)
- [ ] Tests automatisés (unit + integration + e2e)

Voir les [issues ouvertes](https://github.com/ncleton-petitmaker/easyvacataire/issues) pour la liste complète des fonctionnalités proposées et des bugs connus.

---

## Contribuer

Les contributions sont ce qui fait de la communauté open source un endroit extraordinaire pour apprendre, s'inspirer et créer. Toute contribution est **grandement appréciée**.

1. Forkez le projet
2. Créez votre branche (`git checkout -b feature/amazing-feature`)
3. Commitez vos changements (`git commit -m 'Add amazing feature'`)
4. Poussez la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

Consultez [`CONTRIBUTING.md`](CONTRIBUTING.md) pour les directives détaillées.

---

## Licence

Distribué sous la licence **AGPL-3.0**. Voir [`LICENSE`](LICENSE) pour plus d'informations.

> **Pourquoi AGPL ?** EasyVacataire est un outil SaaS. La licence AGPL garantit que toute modification déployée comme service reste open source, tout en permettant une utilisation libre en interne.

---

## Contact

**Nicolas Cleton** — [@ncleton-petitmaker](https://github.com/ncleton-petitmaker)

Lien du projet : [https://github.com/ncleton-petitmaker/easyvacataire](https://github.com/ncleton-petitmaker/easyvacataire)

---

## Remerciements

- [Next.js](https://nextjs.org/) — Le framework React pour la production
- [Supabase](https://supabase.com/) — L'alternative open source à Firebase
- [Evolution API](https://doc.evolution-api.com/) — API WhatsApp open source
- [Mistral AI](https://mistral.ai/) — LLM et embeddings performants en français
- [pgvector](https://github.com/pgvector/pgvector) — Extension PostgreSQL pour la recherche vectorielle
- [Tailwind CSS](https://tailwindcss.com/) — Framework CSS utility-first
- [Lucide](https://lucide.dev/) — Icônes open source

---

<div align="center">

**[Report Bug](https://github.com/ncleton-petitmaker/easyvacataire/issues/new?template=bug_report.yml)** · **[Request Feature](https://github.com/ncleton-petitmaker/easyvacataire/issues/new?template=feature_request.yml)**

Si ce projet vous est utile, pensez à lui donner une étoile !

</div>
