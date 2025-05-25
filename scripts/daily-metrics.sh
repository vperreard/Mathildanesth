#!/bin/bash
# scripts/daily-metrics.sh

echo "=== Métriques quotidiennes Mathildanesth ==="
echo "Date: $(date)"
echo ""

# Structure du projet
echo "=== Structure du projet ==="
echo "Composants React: $(find src/components -name "*.tsx" | wc -l)"
echo "Pages App Router: $(find src/app -name "page.tsx" | wc -l)"
echo "Routes API App Router: $(find src/app/api -name "route.ts" | wc -l)"
echo "Modules métier: $(find src/modules -type d -maxdepth 1 | grep -v "^src/modules$" | wc -l)"
echo "Services: $(find src/services -name "*.ts" | wc -l)"
echo "Tests: $(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l)"
echo ""

# Qualité du code
echo "=== Qualité du code ==="
echo "Fichiers TypeScript: $(find src -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "Fichiers avec @ts-ignore: $(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" | wc -l)"
echo ""

# Métriques JSON pour les outils de monitoring
cat > daily-metrics.json << EOF
{
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "metrics": {
    "components": $(find src/components -name "*.tsx" | wc -l),
    "appRouterPages": $(find src/app -name "page.tsx" | wc -l),
    "appRouterApiRoutes": $(find src/app/api -name "route.ts" | wc -l),
    "modules": $(find src/modules -type d -maxdepth 1 | grep -v "^src/modules$" | wc -l),
    "services": $(find src/services -name "*.ts" | wc -l),
    "tests": $(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l),
    "typescriptFiles": $(find src -name "*.ts" -o -name "*.tsx" | wc -l),
    "tsIgnoreCount": $(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l),
    "migrationComplete": true
  }
}
EOF

echo "Métriques sauvegardées dans daily-metrics.json"