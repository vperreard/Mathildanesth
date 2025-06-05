/**
 * Helper pour la migration de xlsx vers papaparse
 * Ce fichier fournit des fonctions de compatibilité pendant la migration
 */

import { exportSimulationResults, exportLeaveData, exportPlanningData } from '@/services/exportServiceV2';

import { logger } from "../lib/logger";
// Types de compatibilité
export type ExportFormat = 'csv' | 'pdf';

// Fonction de migration pour les anciens appels
export async function migrateExcelExport(
    data: unknown,
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
    logger.warn(
        '⚠️ XLSX est déprécié et sera supprimé dans une future version. ' +
        'Utilisez les fonctions d\'export CSV/PDF du nouveau service exportServiceV2.'
    );
}
