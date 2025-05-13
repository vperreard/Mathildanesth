/**
 * Types de secteurs opératoires
 * Utilisés pour catégoriser les secteurs et appliquer des règles spécifiques
 */
export const SECTOR_TYPES = {
    STANDARD: 'STANDARD',
    HYPERASEPTIQUE: 'HYPERASEPTIQUE',
    OPHTALMOLOGIE: 'OPHTALMOLOGIE',
    ENDOSCOPIE: 'ENDOSCOPIE'
};

/**
 * Types de secteurs avec libellés pour l'affichage
 */
export const SECTOR_TYPE_LABELS = {
    STANDARD: 'Standard',
    HYPERASEPTIQUE: 'Hyperaseptique',
    OPHTALMOLOGIE: 'Ophtalmologie',
    ENDOSCOPIE: 'Endoscopie'
};

/**
 * Obtient tous les types de secteurs sous forme de tableau pour utilisation dans les sélecteurs
 */
export function getSectorTypeOptions() {
    return Object.entries(SECTOR_TYPE_LABELS).map(([value, label]) => ({ value, label }));
} 