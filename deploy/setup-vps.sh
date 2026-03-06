#!/bin/bash
set -euo pipefail

########################################################################
# EasyVacataire — Script d'installation VPS
#
# Pre-requis: VPS Ubuntu 22.04+ avec Docker + Docker Compose installes
# Coolify deja installe (https://coolify.io/docs/installation)
#
# Usage: bash setup-vps.sh
########################################################################

DEPLOY_DIR="/opt/uniplanning"
REPO_URL="${1:-}"

echo "=== EasyVacataire — Setup VPS ==="
echo ""

# 1. Creer le repertoire
echo "[1/6] Creation du repertoire ${DEPLOY_DIR}..."
sudo mkdir -p "${DEPLOY_DIR}"
sudo chown "$USER:$USER" "${DEPLOY_DIR}"

# 2. Copier les fichiers d'infra
echo "[2/6] Copie des fichiers d'infrastructure..."
cp docker-compose.infra.yml "${DEPLOY_DIR}/"
cp kong.yml "${DEPLOY_DIR}/"
cp -r init-db "${DEPLOY_DIR}/"

# 3. Verifier le .env
if [ ! -f "${DEPLOY_DIR}/.env" ]; then
  cp .env.example "${DEPLOY_DIR}/.env"
  echo ""
  echo "IMPORTANT: Editez ${DEPLOY_DIR}/.env avec vos vraies valeurs !"
  echo "  nano ${DEPLOY_DIR}/.env"
  echo ""
  echo "Puis relancez ce script."
  exit 0
fi

# 4. Generer les JWT keys si vides
source "${DEPLOY_DIR}/.env"
if [ -z "${SUPABASE_ANON_KEY:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "[3/6] Generation des cles JWT Supabase..."

  if ! command -v node &> /dev/null; then
    echo "Node.js requis pour generer les JWT. Installez-le ou generez les cles manuellement."
    exit 1
  fi

  ANON_KEY=$(node -e "
    const crypto = require('crypto');
    const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
    const payload = Buffer.from(JSON.stringify({role:'anon',iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+315360000})).toString('base64url');
    const sig = crypto.createHmac('sha256','${JWT_SECRET}').update(header+'.'+payload).digest('base64url');
    console.log(header+'.'+payload+'.'+sig);
  ")

  SERVICE_KEY=$(node -e "
    const crypto = require('crypto');
    const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
    const payload = Buffer.from(JSON.stringify({role:'service_role',iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+315360000})).toString('base64url');
    const sig = crypto.createHmac('sha256','${JWT_SECRET}').update(header+'.'+payload).digest('base64url');
    console.log(header+'.'+payload+'.'+sig);
  ")

  sed -i "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=${ANON_KEY}|" "${DEPLOY_DIR}/.env"
  sed -i "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}|" "${DEPLOY_DIR}/.env"
  sed -i "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}|" "${DEPLOY_DIR}/.env"

  echo "  Anon key: ${ANON_KEY:0:20}..."
  echo "  Service key: ${SERVICE_KEY:0:20}..."
else
  echo "[3/6] Cles JWT deja presentes, skip."
fi

# 5. Demarrer l'infrastructure
echo "[4/6] Demarrage de l'infrastructure Docker..."
cd "${DEPLOY_DIR}"
docker compose -f docker-compose.infra.yml --env-file .env up -d

echo "[5/6] Attente que Supabase DB soit pret..."
sleep 10

# 6. Appliquer les migrations
echo "[6/6] Application des migrations..."
MIGRATIONS_DIR="$(dirname "$0")/../supabase/migrations"
if [ -d "${MIGRATIONS_DIR}" ]; then
  for f in "${MIGRATIONS_DIR}"/*.sql; do
    echo "  Applying $(basename "$f")..."
    docker exec -i univ-supabase-db psql -U postgres -d postgres < "$f" 2>&1 || true
  done
  echo "  Migrations appliquees."
else
  echo "  Pas de repertoire migrations trouve. Appliquez-les manuellement."
fi

echo ""
echo "=== Infrastructure demarree ==="
echo ""
echo "Services:"
echo "  Supabase DB:     localhost:5432"
echo "  Supabase Auth:   http://localhost:9999 (interne)"
echo "  Supabase REST:   http://localhost:3000 (interne via Kong)"
echo "  Supabase Kong:   https://localhost:8443"
echo "  Supabase Studio: http://localhost:3100"
echo "  Evolution API:   http://localhost:8080"
echo ""
echo "Prochaine etape:"
echo "  1. Dans Coolify, ajoutez un nouveau service 'Docker Image' ou 'Git Repository'"
echo "  2. Pointez vers votre repo git"
echo "  3. Configurez le Dockerfile: ./Dockerfile"
echo "  4. Ajoutez les variables d'environnement (voir .env)"
echo "  5. Configurez le domaine et le SSL"
echo "  6. Connectez le container au reseau Docker 'univ'"
echo ""
echo "Pour connecter le container Next.js au reseau de l'infra:"
echo "  docker network connect univ <container_nextjs>"
echo ""
