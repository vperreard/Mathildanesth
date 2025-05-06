#!/bin/bash

# Tuer tous les processus Node existants
echo "Nettoyage des processus Node existants..."
pkill -f "node" || true

# Supprimer les dossiers de cache
echo "Nettoyage des caches..."
rm -rf .next

# Variables d'environnement pour les tests
export PORT=3000
export CYPRESS_BASE_URL=http://localhost:3000
export NODE_ENV=test
export TEST_DATABASE_URL="postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_test"

# Exécuter les tests
echo "Exécution des tests Cypress..."
npx start-server-and-test \
  "npm run dev" \
  "http://localhost:3000" \
  "npx cypress run --spec cypress/e2e/leaves/quota-management.spec.ts"

echo "Tests terminés!" 