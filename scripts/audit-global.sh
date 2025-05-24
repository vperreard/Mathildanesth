#!/bin/bash
# scripts/audit-global.sh

echo "🔍 AUDIT GLOBAL MATHILDANESTH"
echo "================================"

# Dette technique
echo "📊 DETTE TECHNIQUE:"
echo "- TODO/FIXME/HACK:"
grep -r "TODO\|FIXME\|HACK\|WORKAROUND" src --include="*.ts" --include="*.tsx" | wc -l

echo "- @ts-ignore:"
grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" | wc -l

echo "- Types 'any':"
grep -r ": any\|as any" src --include="*.ts" --include="*.tsx" | wc -l

# Architecture
echo ""
echo "🏗️ ARCHITECTURE:"
echo "- Fichiers Pages Router:"
find src/pages/api -name "*.ts" 2>/dev/null | wc -l

echo "- Fichiers App Router:"
find src/app/api -name "route.ts" 2>/dev/null | wc -l

# Tests
echo ""
echo "🧪 TESTS:"
echo "- Fichiers de tests:"
find src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | wc -l

echo "- Fichiers TypeScript total:"
find src -name "*.ts" -o -name "*.tsx" | wc -l

# Performance
echo ""
echo "⚡ PERFORMANCE:"
echo "- Bundle size actuel:"
du -sh node_modules/.next/static 2>/dev/null || echo "Non disponible (lancer npm run build)"

echo ""
echo "🎯 Objectifs du refactoring:"
echo "- Dette technique: < 10 occurrences"
echo "- Couverture tests: > 80%"
echo "- Performance: toutes pages < 3s"
echo "- Architecture: App Router uniquement"