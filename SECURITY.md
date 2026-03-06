# Politique de sécurité

## Versions supportées

| Version | Supporté |
|---------|----------|
| dernière version sur `main` | Oui |
| versions antérieures | Non |

## Signaler une vulnérabilité

**Ne signalez pas les vulnérabilités de sécurité via les issues publiques GitHub.**

Envoyez un email à **nicoc.spam@gmail.com** avec les informations suivantes :

- Description de la vulnérabilité
- Étapes de reproduction
- Impact potentiel
- Suggestion de correction (si applicable)

### Délai de réponse

- **Accusé de réception** : sous 48 heures
- **Évaluation initiale** : sous 7 jours
- **Correction** : selon la sévérité, entre 7 et 30 jours

### Processus

1. Vous signalez la vulnérabilité par email
2. Nous accusons réception et évaluons la sévérité
3. Nous développons un correctif en privé
4. Nous publions le correctif et vous créditons (sauf si vous préférez rester anonyme)
5. Nous publions un avis de sécurité sur GitHub

## Bonnes pratiques de sécurité

Si vous déployez EasyVacataire :

- Ne commitez **jamais** de secrets (`.env`, clés API) dans Git
- Utilisez des **mots de passe forts** pour Supabase et Evolution API
- Activez les **RLS policies** Supabase (incluses dans les migrations)
- Déployez derrière un **reverse proxy HTTPS** (nginx, Caddy, Traefik)
- Gardez vos dépendances **à jour** (`npm audit`)
- Limitez l'accès au **service role key** Supabase aux routes API serveur uniquement

## Périmètre

Cette politique couvre le code du repository EasyVacataire. Les services tiers (Supabase, Evolution API, Mistral AI) ont leurs propres politiques de sécurité.
