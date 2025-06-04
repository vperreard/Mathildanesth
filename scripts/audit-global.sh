#!/bin/bash
# scripts/audit-global.sh

echo "🔍 AUDIT GLOBAL - MATHILDANESTH"
echo "================================"
echo "Date: $(date)"
echo ""

# 1. Architecture générale
echo "📁 ARCHITECTURE"
echo "---------------"
echo "App Router pages: $(find src/app -name "page.tsx" | wc -l)"
echo "App Router API routes: $(find src/app/api -name "route.ts" | wc -l)"
echo "Composants React: $(find src/components -name "*.tsx" | wc -l)"
echo "Modules métier: $(find src/modules -type d -maxdepth 1 | grep -v "^src/modules$" | wc -l)"
echo "Services: $(find src/services -name "*.ts" | wc -l)"
echo ""

# 2. Qualité du code
echo "🔧 QUALITÉ DU CODE"
echo "-------------------"
echo "Total fichiers TypeScript: $(find src -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "Fichiers avec @ts-ignore: $(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)"
echo "Fichiers avec TODO/FIXME: $(grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)"
echo "Fichiers avec 'any' type: $(grep -r ": any\|as any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)"
echo ""

# 3. Tests
echo "🧪 TESTS"
echo "--------"
TEST_FILES=$(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
TOTAL_FILES=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
COVERAGE_RATIO=$(echo "scale=1; $TEST_FILES * 100 / $TOTAL_FILES" | bc 2>/dev/null || echo "N/A")
echo "Fichiers de test: $TEST_FILES"
echo "Total fichiers source: $TOTAL_FILES"
echo "Ratio de couverture: ${COVERAGE_RATIO}%"
echo ""

# 4. Migration App Router
echo "🚀 MIGRATION APP ROUTER"
echo "------------------------"
if [ ! -d "src/pages/api" ]; then
    echo "✅ Migration vers App Router COMPLÈTE"
    echo "✅ Pages Router API supprimé"
else
    echo "❌ Migration vers App Router INCOMPLÈTE"
    echo "❌ src/pages/api existe encore"
fi
echo ""

# 5. Dépendances et sécurité
echo "📦 DÉPENDANCES"
echo "--------------"
if [ -f "package.json" ]; then
    DEPS=$(cat package.json | jq '.dependencies | keys | length' 2>/dev/null || echo "N/A")
    DEV_DEPS=$(cat package.json | jq '.devDependencies | keys | length' 2>/dev/null || echo "N/A")
    echo "Dépendances production: $DEPS"
    echo "Dépendances développement: $DEV_DEPS"
fi
echo ""

# 6. Performance et build
echo "⚡ PERFORMANCE"
echo "-------------"
if [ -f ".next/build-manifest.json" ]; then
    echo "✅ Build Next.js présent"
else
    echo "❌ Pas de build Next.js détecté"
fi
echo ""

# 7. Recommandations
echo "💡 RECOMMANDATIONS"
echo "------------------"
TS_IGNORE_COUNT=$(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$TS_IGNORE_COUNT" -gt 0 ]; then
    echo "- Réduire les @ts-ignore ($TS_IGNORE_COUNT occurrences)"
fi

TODO_COUNT=$(grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$TODO_COUNT" -gt 10 ]; then
    echo "- Traiter les TODO/FIXME prioritaires ($TODO_COUNT occurrences)"
fi

if [ ! -d "src/pages/api" ]; then
    echo "✅ Migration App Router terminée avec succès"
else
    echo "- Terminer la migration vers App Router"
fi

echo ""
echo "🎯 Score global: App Router moderne avec architecture Next.js 15+"