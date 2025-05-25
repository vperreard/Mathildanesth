/**
 * Types de salles opératoires
 * Utilisés pour appliquer des règles spécifiques selon le type de salle
 */
export const ROOM_TYPES = {
    STANDARD: 'STANDARD',
    ASEPTIQUE: 'ASEPTIQUE',
    ENDOSCOPIE: 'ENDOSCOPIE',
    GARDE: 'GARDE',
    ASTREINTE: 'ASTREINTE',
    CONSULTATION: 'CONSULTATION'
};

/**
 * Types de salles avec libellés pour l'affichage
 */
export const ROOM_TYPE_LABELS = {
    STANDARD: 'Standard',
    ASEPTIQUE: 'Aseptique',
    ENDOSCOPIE: 'Endoscopie',
    GARDE: 'Garde',
    ASTREINTE: 'Astreinte',
    CONSULTATION: 'Consultation'
};

/**
 * Obtient tous les types de salles sous forme de tableau pour utilisation dans les sélecteurs
 */
export function getRoomTypeOptions() {
    return Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => ({ value, label }));
} 