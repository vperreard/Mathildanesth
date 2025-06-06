#!/bin/bash
# Script pour corriger automatiquement certaines erreurs de build

echo "🔧 Fixing common build errors..."

# Fix 1: Corriger les noms de méthodes dans ReglesSupervisionAdmin.tsx
echo "Fixing method names in ReglesSupervisionAdmin.tsx..."
sed -i '' 's/getAllSupervisionRules/getAllSupervisorRules/g' src/app/admin/bloc-operatoire/components/ReglesSupervisionAdmin.tsx
sed -i '' 's/getAllSectors/getAllOperatingSectors/g' src/app/admin/bloc-operatoire/components/ReglesSupervisionAdmin.tsx
sed -i '' 's/deleteSupervisionRule/deleteSupervisorRule/g' src/app/admin/bloc-operatoire/components/ReglesSupervisionAdmin.tsx
sed -i '' 's/updateSupervisionRule/updateSupervisorRule/g' src/app/admin/bloc-operatoire/components/ReglesSupervisionAdmin.tsx
sed -i '' 's/createSupervisionRule/createSupervisorRule/g' src/app/admin/bloc-operatoire/components/ReglesSupervisionAdmin.tsx

# Fix 2: Corriger les noms de méthodes dans SecteursAdmin.tsx
echo "Fixing method names in SecteursAdmin.tsx..."
sed -i '' 's/getAllSectors/getAllOperatingSectors/g' src/app/admin/bloc-operatoire/components/SecteursAdmin.tsx

# Fix 3: Corriger les propriétés BlocSector
echo "Fixing BlocSector properties..."
# Dans SecteursAdmin.tsx
sed -i '' 's/secteur\.nom/secteur.name/g' src/app/admin/bloc-operatoire/components/SecteursAdmin.tsx
sed -i '' 's/secteur\.couleur/secteur.colorCode/g' src/app/admin/bloc-operatoire/components/SecteursAdmin.tsx
sed -i '' 's/secteur\.estActif/secteur.isActive/g' src/app/admin/bloc-operatoire/components/SecteursAdmin.tsx

# Dans ReglesSupervisionAdmin.tsx
sed -i '' 's/secteur\.nom/secteur.name/g' src/app/admin/bloc-operatoire/components/ReglesSupervisionAdmin.tsx
sed -i '' 's/secteur\.couleur/secteur.colorCode/g' src/app/admin/bloc-operatoire/components/ReglesSupervisionAdmin.tsx

# Fix 4: Corriger secteurId vs sectorId
sed -i '' 's/room\.secteurId/room.sectorId/g' src/app/admin/bloc-operatoire/components/SecteursAdmin.tsx

echo "✅ Automated fixes applied!"
echo "Note: Some manual fixes may still be required for complex type errors."