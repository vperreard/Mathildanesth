/**
 * Types de catégories de secteurs opératoires
 * Utilisés pour appliquer des règles de supervision spécifiques selon le type de secteur
 */
export const SECTOR_CATEGORY_TYPES = {
    STANDARD: 'STANDARD',
    HYPERASEPTIQUE: 'HYPERASEPTIQUE',
    OPHTALMOLOGIE: 'OPHTALMOLOGIE',
    ENDOSCOPIE: 'ENDOSCOPIE'
};

/**
 * Types de catégories de secteurs avec libellés pour l'affichage
 */
export const SECTOR_CATEGORY_LABELS = {
    STANDARD: 'Standard',
    HYPERASEPTIQUE: 'Hyperaseptique',
    OPHTALMOLOGIE: 'Ophtalmologie',
    ENDOSCOPIE: 'Endoscopie'
};

/**
 * Obtient tous les types de catégories de secteurs sous forme de tableau pour utilisation dans les sélecteurs
 */
export function getSectorCategoryOptions() {
    return Object.entries(SECTOR_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
} 