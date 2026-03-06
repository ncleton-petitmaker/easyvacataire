# Contribuer à EasyVacataire

Merci de votre intérêt pour EasyVacataire ! Ce guide vous explique comment contribuer au projet.

## Code de conduite

En participant à ce projet, vous acceptez de respecter notre [Code de conduite](CODE_OF_CONDUCT.md).

## Comment contribuer

### Signaler un bug

1. Vérifiez que le bug n'a pas déjà été signalé dans les [issues](https://github.com/ncleton-petitmaker/easyvacataire/issues)
2. Ouvrez une [nouvelle issue](https://github.com/ncleton-petitmaker/easyvacataire/issues/new?template=bug_report.yml) en utilisant le template "Bug Report"
3. Décrivez le comportement attendu et le comportement observé
4. Incluez des étapes de reproduction et des captures d'écran si possible

### Proposer une fonctionnalité

1. Ouvrez une [nouvelle issue](https://github.com/ncleton-petitmaker/easyvacataire/issues/new?template=feature_request.yml) en utilisant le template "Feature Request"
2. Décrivez clairement la fonctionnalité et son utilité
3. Attendez la validation d'un mainteneur avant de commencer le développement

### Soumettre du code

#### Prérequis

- Node.js >= 20.x
- Docker et Docker Compose
- Supabase CLI
- Git

#### Mise en place locale

```bash
# 1. Forker le repository sur GitHub

# 2. Cloner votre fork
git clone https://github.com/VOTRE_USERNAME/easyvacataire.git
cd easyvacataire

# 3. Ajouter le remote upstream
git remote add upstream https://github.com/ncleton-petitmaker/easyvacataire.git

# 4. Installer les dépendances
npm install

# 5. Copier le fichier d'environnement
cp .env.example .env.local

# 6. Démarrer les services locaux
supabase start
docker compose up -d
npm run dev
```

#### Workflow de contribution

1. **Synchronisez** votre fork avec upstream :
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Créez une branche** depuis `main` :
   ```bash
   git checkout -b feature/ma-fonctionnalite
   # ou
   git checkout -b fix/mon-bugfix
   ```

3. **Développez** en respectant les conventions ci-dessous

4. **Vérifiez** votre code :
   ```bash
   npm run lint
   npm run build
   ```

5. **Commitez** en suivant les conventions de commit :
   ```bash
   git commit -m "feat: add availability export to CSV"
   ```

6. **Poussez** et ouvrez une Pull Request :
   ```bash
   git push origin feature/ma-fonctionnalite
   ```

## Conventions

### Branches

| Préfixe | Usage |
|---------|-------|
| `feature/` | Nouvelle fonctionnalité |
| `fix/` | Correction de bug |
| `docs/` | Documentation |
| `refactor/` | Refactoring sans changement fonctionnel |
| `chore/` | Maintenance (deps, CI, config) |

### Commits

Nous utilisons les [Conventional Commits](https://www.conventionalcommits.org/) :

| Type | Description |
|------|-------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `style` | Formatage, pas de changement de logique |
| `refactor` | Refactoring sans ajout de fonctionnalité ni correction |
| `test` | Ajout ou modification de tests |
| `chore` | Maintenance du build, deps, CI |

### Code style

- **TypeScript** strict — pas de `any` sauf cas justifié
- **Tailwind CSS** — pas de CSS custom sauf nécessité
- **Nommage** : camelCase pour les variables/fonctions, PascalCase pour les composants
- **Imports** : utiliser les alias `@/` (configuré dans `tsconfig.json`)
- Linter : `npm run lint` doit passer sans erreur

### Pull Requests

- Donnez un titre clair et descriptif
- Remplissez le template de PR
- Liez l'issue correspondante (`Closes #123`)
- Incluez des captures d'écran pour les changements visuels
- Assurez-vous que le lint et le build passent
- Attendez la review d'au moins un mainteneur

## Structure du projet

Consultez le [README](README.md#structure-du-projet) pour une vue détaillée de l'arborescence du projet.

## Questions ?

Ouvrez une [discussion](https://github.com/ncleton-petitmaker/easyvacataire/discussions) ou contactez les mainteneurs.

---

Merci pour votre contribution !
