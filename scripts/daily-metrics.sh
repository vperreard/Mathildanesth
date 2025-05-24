#!/bin/bash
# scripts/daily-metrics.sh

DATE=$(date +"%Y-%m-%d")
METRICS_FILE="metrics/daily-$DATE.json"

echo "📈 Métriques du $DATE"

# Créer le dossier metrics s'il n'existe pas
mkdir -p metrics

# Générer les métriques en JSON
cat > $METRICS_FILE << EOF
{
  "date": "$DATE",
  "technicalDebt": {
    "todoCount": $(grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" | wc -l),
    "tsIgnoreCount": $(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" | wc -l),
    "anyTypeCount": $(grep -r ": any\|as any" src --include="*.ts" --include="*.tsx" | wc -l)
  },
  "architecture": {
    "pagesRouterFiles": $(find src/pages/api -name "*.ts" 2>/dev/null | wc -l),
    "appRouterFiles": $(find src/app/api -name "route.ts" 2>/dev/null | wc -l)
  },
  "tests": {
    "testFiles": $(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l),
    "totalFiles": $(find src -name "*.ts" -o -name "*.tsx" | wc -l)
  }
}
EOF

echo "Métriques sauvegardées dans $METRICS_FILE"

# Afficher un résumé
echo ""
echo "📊 Résumé:"
echo "- Dette technique: $(grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" | wc -l) occurrences"
echo "- @ts-ignore: $(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" | wc -l) occurrences"
echo "- Couverture tests: $(echo "scale=1; $(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l) * 100 / $(find src -name "*.ts" -o -name "*.tsx" | wc -l)" | bc)%"