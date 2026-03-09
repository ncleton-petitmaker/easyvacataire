# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [0.2.0] - 2026-03-09

### Ajouté

#### Calendrier multi-vues
- Vues **Mois**, **Semaine** et **Jour** avec grille horaire interactive (07h–20h)
- Navigation fluide entre les vues avec conservation du contexte de date
- Événements positionnés à la minute sur la grille temporelle
- Panel latéral de détail du jour avec toutes les informations (créneaux, dispos, indispos)

#### Synchronisation Google Calendar
- Connexion OAuth Google depuis l'espace vacataire
- Affichage des créneaux occupés Google sur le planning (événements gris)
- **Auto-remplissage des disponibilités** : détecte les créneaux libres dans Google Calendar et les ajoute automatiquement
- Synchronisation automatique toutes les 15 minutes via cron
- Modale de proposition d'auto-remplissage après la connexion Google
- Déconnexion Google supprime automatiquement les disponibilités auto-générées

#### Indisponibilités récurrentes
- Règles d'indisponibilité configurables : jour spécifique, lundi–vendredi, ou tous les jours
- Interface de gestion visuelle avec labels personnalisés
- Prise en compte automatique dans le calcul des disponibilités auto

#### Buffer temps de route
- Paramètre **temps de route** par vacataire (0 à 180 minutes)
- Affichage visuel des zones de buffer sur la grille horaire (violet hachuré)
- Affichage dans le panel latéral de détail du jour
- **Validation côté admin** : l'algorithme de matching refuse les créneaux qui empiètent sur le buffer
- Recalcul automatique des auto-dispos quand le buffer change

#### Suivi des heures et paiements (HeTD)
- Types de session **CM / TD / TP** sur les besoins et créneaux
- Calcul automatique des **heures équivalent TD** (CM ×1.5, TD ×1, TP ×2/3)
- Tarifs officiels janvier 2025 (CM 65.25€/h, TD 43.50€/h, TP 29.00€/h)
- Suivi du statut de paiement par session (non payé / payé)
- Plafond annuel 187 HeTD avec barre de progression
- **Export PDF** « État de service fait » conforme au format universitaire (tableau, totaux, bloc signature)

#### Fiche vacataire enrichie
- Édition inline des informations de l'intervenant
- 6 cards analytics : sessions réalisées, HeTD validées, montant brut, plafond annuel, à payer, payées
- Badges colorés CM/TD/TP, toggle paiement par session
- Action « Marquer tout comme payé »
- Validation des sessions (réalisé / non réalisé)

#### Espace vacataire
- Page `/vacataire/suivi` : suivi personnel des heures, HeTD et paiements
- Page `/vacataire/disponibilites` : saisie des disponibilités depuis l'espace connecté
- Page `/vacataire/demandes` : réponse aux demandes de disponibilité
- Fusion planning + saisie des dispos sur une seule page

#### Demandes de disponibilité
- Création de demandes par l'admin avec message personnalisé
- File d'attente d'envoi par WhatsApp
- Page de validation web par token (sans authentification)
- Suivi des réponses (accepté / refusé / en attente)

#### GenBI — Interrogation en langage naturel
- Requêtes en français : *« Combien de sessions ce mois-ci ? »*
- Routeur sémantique pour détecter les questions analytiques
- Traduction en SQL via Wren Engine (ibis-server)
- Exécution sécurisée (lecture seule) sur la base PostgreSQL

#### Authentification OTP par email
- Envoi du code OTP par email via **Resend** (en complément de WhatsApp)
- Login simplifié en 2 étapes (téléphone → code)

#### WhatsApp — Améliorations
- **Typing indicator** : indicateur de saisie pendant le traitement
- **Mark as read** : coches bleues automatiques dès réception
- Formatage amélioré des messages (blocs numérotés, labels FR)

#### Sécurité et architecture
- Protection des routes admin et super-admin par rôle dans le middleware
- Routes API protégées par rôle (admin, super_admin, vacataire)
- Exceptions pour les routes vacataire autorisées (buffer, etc.)
- Architecture multi-établissement avec page super-admin

#### Interface
- Refonte visuelle complète avec **shadcn/ui**
- Charte couleurs EasyVacataire (amber + primary #4243C4)
- Sidebar responsive (hamburger mobile)
- Couleurs différenciées : vert foncé (confirmé), vert clair (disponible)
- Animation style « Tinder » sur le matching admin

### Corrigé

- Fix clics impossibles sur les vues semaine/jour (`pointer-events-none`)
- Fix boucle infinie sur le planning (clignotement)
- Fix middleware rendant toutes les routes publiques (`/` dans publicPaths)
- Fix validation Zod trop stricte sur les UUID et les champs nullable
- Fix polyfill Temporal pour Safari (Schedule-X)
- Fix endpoint Wren ibis-server (`/v2/connector/`)
- Fix build : lazy init Resend pour éviter erreur sans clé API

---

## [0.1.0] - 2026-03-06

### Ajouté

- Authentification OTP via WhatsApp (Evolution API)
- CRUD complet : intervenants, matières, besoins, créneaux
- Import CSV des besoins de l'établissement
- Calendrier interactif de saisie des disponibilités
- Lien public de disponibilités (sans authentification)
- Algorithme de matching besoins / disponibilités
- Vue matching split-screen avec animation
- Bot WhatsApp conversationnel (Mistral AI avec function calling)
- Mode fallback du bot (détection par mots-clés, sans API LLM)
- Base de connaissances avec pipeline RAG (chunking + embedding + recherche vectorielle)
- Dashboard administration complet (7 pages)
- Dashboard intervenant (planning, disponibilités, infos)
- Rappels automatiques (J-7, J-1, J-0) par WhatsApp
- Notifications de changement de salle/horaire en temps réel
- Triggers PostgreSQL pour l'historique des modifications de créneaux
- Architecture multi-tenant par établissement
- Migrations Supabase avec RLS policies
- Dockerfile multi-stage optimisé pour la production
- Docker Compose pour Evolution API (dev local)
- Landing page complète
- Middleware d'authentification Next.js
