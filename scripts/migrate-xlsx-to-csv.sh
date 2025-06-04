#!/bin/bash

# Script de migration de xlsx vers papaparse/CSV
# Ce script remplace toutes les utilisations de xlsx par notre nouveau service d'export

set -e

echo "🔄 Migration de xlsx vers papaparse/CSV"
echo "======================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Sauvegarder les fichiers modifiés
echo -e "${BLUE}1. Création d'une sauvegarde des fichiers...${NC}"
BACKUP_DIR="backup-xlsx-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Liste des fichiers à migrer
FILES_TO_MIGRATE=(
    "src/app/api/calendar/export/route.ts"
    "src/app/admin/simulations/[scenarioId]/results/[resultId]/page.tsx"
    "src/services/exportService.ts"
    "src/modules/calendar/components/CalendarExport.tsx"
    "src/modules/leaves/services/leaveRequestService.ts"
    "src/modules/leaves/services/leaveBalanceService.ts"
    "src/app/api/leaves/quotas/transfers/export/route.ts"
)

# Copier les fichiers dans le backup
for file in "${FILES_TO_MIGRATE[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename $file).bak"
        echo -e "${GREEN}✓${NC} Sauvegarde de $file"
    fi
done

echo ""
echo -e "${BLUE}2. Migration des imports...${NC}"

# Remplacer les imports xlsx
for file in "${FILES_TO_MIGRATE[@]}"; do
    if [ -f "$file" ]; then
        # Remplacer l'import xlsx par notre nouveau service
        sed -i '' "s/import \* as XLSX from 'xlsx';/import { exportSimulationResults, exportLeaveData, exportPlanningData } from '@\/services\/exportServiceV2';/g" "$file"
        sed -i '' "s/import XLSX from 'xlsx';/import { exportSimulationResults, exportLeaveData, exportPlanningData } from '@\/services\/exportServiceV2';/g" "$file"
        sed -i '' "s/const XLSX = require('xlsx');/const { exportSimulationResults, exportLeaveData, exportPlanningData } = require('@\/services\/exportServiceV2');/g" "$file"
        
        echo -e "${GREEN}✓${NC} Migration des imports dans $file"
    fi
done

echo ""
echo -e "${BLUE}3. Mise à jour des références de format...${NC}"

# Mettre à jour les références au format
for file in "${FILES_TO_MIGRATE[@]}"; do
    if [ -f "$file" ]; then
        # Remplacer 'excel' par 'csv' dans les formats d'export
        sed -i '' "s/'excel'/'csv'/g" "$file"
        sed -i '' 's/"excel"/"csv"/g' "$file"
        sed -i '' "s/format: 'excel'/format: 'csv'/g" "$file"
        sed -i '' 's/format: "excel"/format: "csv"/g' "$file"
        
        echo -e "${GREEN}✓${NC} Mise à jour des formats dans $file"
    fi
done

echo ""
echo -e "${BLUE}4. Création du fichier de migration TypeScript...${NC}"

# Créer un fichier helper pour la migration
cat > src/utils/exportMigrationHelper.ts << 'EOF'
/**
 * Helper pour la migration de xlsx vers papaparse
 * Ce fichier fournit des fonctions de compatibilité pendant la migration
 */

import { exportSimulationResults, exportLeaveData, exportPlanningData } from '@/services/exportServiceV2';

// Types de compatibilité
export type ExportFormat = 'csv' | 'pdf';

// Fonction de migration pour les anciens appels
export async function migrateExcelExport(
    data: any,
    format: string,
    fileName?: string
): Promise<Blob> {
    // Si le format était 'excel', le convertir en 'csv'
    const newFormat: ExportFormat = format === 'excel' ? 'csv' : format as ExportFormat;
    
    // Déterminer le type de données et appeler la bonne fonction
    if (data.scenarioName) {
        return exportSimulationResults(data, { format: newFormat, fileName });
    } else if (Array.isArray(data) && data[0]?.startDate) {
        return exportLeaveData(data, newFormat, fileName);
    } else if (Array.isArray(data) && data[0]?.date) {
        return exportPlanningData(data, newFormat, fileName);
    }
    
    // Fallback : exporter en CSV générique
    throw new Error('Type de données non reconnu pour l\'export');
}

// Message de dépréciation
export function warnXlsxDeprecation() {
    console.warn(
        '⚠️ XLSX est déprécié et sera supprimé dans une future version. ' +
        'Utilisez les fonctions d\'export CSV/PDF du nouveau service exportServiceV2.'
    );
}
EOF

echo -e "${GREEN}✓${NC} Fichier helper créé"

echo ""
echo -e "${BLUE}5. Suppression de xlsx de package.json...${NC}"

# Supprimer xlsx des dépendances
npm uninstall xlsx --legacy-peer-deps

echo ""
echo -e "${GREEN}✅ Migration terminée !${NC}"
echo ""
echo -e "${YELLOW}Actions manuelles requises :${NC}"
echo "1. Vérifier que les exports fonctionnent correctement"
echo "2. Tester les exports CSV et PDF dans l'application"
echo "3. Mettre à jour la documentation utilisateur"
echo "4. Supprimer le dossier de backup après validation : rm -rf $BACKUP_DIR"
echo ""
echo -e "${BLUE}Fichiers modifiés :${NC}"
for file in "${FILES_TO_MIGRATE[@]}"; do
    if [ -f "$file" ]; then
        echo "  - $file"
    fi
done
echo ""
echo "Migration effectuée le $(date)"