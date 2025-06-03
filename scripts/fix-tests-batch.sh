#!/bin/bash

# Script de réparation automatique des tests par batch

echo "🔧 RÉPARATION AUTOMATIQUE DES TESTS"
echo "===================================="

# 1. Correction des imports manquants
echo -e "\n📦 Étape 1: Correction des imports Prisma..."
find src -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
  # Remplacer les imports UserRole, etc. incorrects
  sed -i '' 's/import { UserRole } from "@prisma\/client"/import { MockedPrismaEnums } from "@\/test-utils\/globalMocks"; const { UserRole } = MockedPrismaEnums/' "$file"
  sed -i '' 's/import { LeaveStatus } from "@prisma\/client"/import { MockedPrismaEnums } from "@\/test-utils\/globalMocks"; const { LeaveStatus } = MockedPrismaEnums/' "$file"
done

# 2. Correction des chaînes avec apostrophes
echo -e "\n✏️  Étape 2: Correction des erreurs de syntaxe..."
find src -name "*.test.ts" -o -name "*.test.tsx" | while read file; do
  # Échapper les apostrophes dans les chaînes
  sed -i '' "s/d'activité/d\\'activité/g" "$file"
  sed -i '' "s/l'ID/l\\'ID/g" "$file"
done

# 3. Lancer les tests par groupe
echo -e "\n🧪 Étape 3: Tests par catégorie..."

# Types tests
echo "Testing types..."
npm test -- src/types/__tests__ --passWithNoTests --maxWorkers=2

# Services tests
echo "Testing services..."
npm test -- src/services/__tests__ --passWithNoTests --maxWorkers=2

# Components tests
echo "Testing components..."
npm test -- src/components/__tests__ --passWithNoTests --maxWorkers=2

# Integration tests
echo "Testing integration..."
npm test -- src/tests/integration --passWithNoTests --maxWorkers=2

echo -e "\n✅ Script terminé!"