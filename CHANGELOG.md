# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

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
