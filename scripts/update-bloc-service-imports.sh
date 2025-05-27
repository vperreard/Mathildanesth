#!/bin/bash

# Script pour mettre à jour tous les imports des services bloc-operatoire
# Remplace les anciens imports par les nouveaux

echo "🔄 Mise à jour des imports des services bloc-operatoire..."

# Remplacer blocPlanningService
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\'']\(@/\)\?services/blocPlanningService["'\'']|from "@/modules/planning/bloc-operatoire/services/blocPlanningService"|g' {} \;

# Remplacer blocPlanningDragDropService
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\'']\(@/\)\?services/blocPlanningDragDropService["'\'']|from "@/modules/planning/bloc-operatoire/services/blocPlanningDragDropService"|g' {} \;

# Remplacer blocPlanningApi
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\'']\(@/\)\?services/blocPlanningApi["'\'']|from "@/modules/planning/bloc-operatoire/services/blocPlanningService"|g' {} \;

# Remplacer blocPlanningValidator
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|from ["'\'']\(@/\)\?services/blocPlanningValidator["'\'']|from "@/modules/planning/bloc-operatoire/services/blocPlanningService"|g' {} \;

echo "✅ Imports mis à jour"

# Afficher les fichiers qui importent encore depuis l'ancien répertoire
echo ""
echo "🔍 Vérification des imports restants..."
remaining=$(grep -r "from.*services/bloc" src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l)

if [ "$remaining" -gt 0 ]; then
  echo "⚠️  Il reste $remaining imports à migrer manuellement:"
  grep -r "from.*services/bloc" src --include="*.ts" --include="*.tsx" | grep -v "node_modules"
else
  echo "✅ Tous les imports ont été migrés"
fi