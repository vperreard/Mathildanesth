import { LeaveType } from '../types/leave';

/**
 * Utilitaires pour la gestion des types de congés
 */

/**
 * Obtenir le libellé à afficher pour un type de congé
 * @param leaveType Type de congé
 * @returns Libellé formaté pour l'affichage
 */
export const getLabelForLeaveType = (leaveType: LeaveType): string => {
    // Mapping des types de congés vers des libellés plus lisibles en français
    const labelMap: Record<string, string> = {
        CONGE_PAYE: 'Congé payé',
        SANS_SOLDE: 'Congé sans solde',
        RTT: 'RTT',
        MALADIE: 'Congé maladie',
        MATERNITE: 'Congé maternité',
        PATERNITE: 'Congé paternité',
        FORMATION: 'Formation',
        AUTRE: 'Autre type de congé',
    };

    // Retourner le libellé s'il existe, sinon retourner le type tel quel
    return labelMap[leaveType] || leaveType;
};

/**
 * Obtenir une couleur associée à un type de congé
 * @param leaveType Type de congé
 * @returns Couleur au format hex
 */
export const getColorForLeaveType = (leaveType: LeaveType): string => {
    // Mapping des types de congés vers des couleurs
    const colorMap: Record<string, string> = {
        CONGE_PAYE: '#0ea5e9', // bleu
        SANS_SOLDE: '#94a3b8', // gris
        RTT: '#10b981', // vert
        MALADIE: '#ef4444', // rouge
        MATERNITE: '#ec4899', // rose
        PATERNITE: '#8b5cf6', // violet
        FORMATION: '#f59e0b', // ambre
        AUTRE: '#78716c', // gris-brun
    };

    // Retourner la couleur si elle existe, sinon retourner gris
    return colorMap[leaveType] || '#94a3b8';
};

/**
 * Obtenir tous les types de congés avec leurs libellés
 * @returns Tableau d'objets avec les types et libellés
 */
export const getAllLeaveTypesWithLabels = (): { value: LeaveType; label: string }[] => {
    return Object.values(LeaveType).map(type => ({
        value: type as LeaveType,
        label: getLabelForLeaveType(type as LeaveType),
    }));
};

/**
 * Regrouper les types de congés par catégorie
 * @returns Objet avec les catégories et leurs types associés
 */
export const getLeaveTypesByCategory = (): Record<string, { value: LeaveType; label: string }[]> => {
    const standardTypes = [LeaveType.CONGE_PAYE, LeaveType.RTT];
    const specialTypes = [LeaveType.MALADIE, LeaveType.MATERNITE, LeaveType.PATERNITE];
    const otherTypes = [LeaveType.SANS_SOLDE, LeaveType.FORMATION, LeaveType.AUTRE];

    const mapTypeToObject = (type: LeaveType) => ({
        value: type,
        label: getLabelForLeaveType(type),
    });

    return {
        'Standards': standardTypes.map(mapTypeToObject),
        'Spéciaux': specialTypes.map(mapTypeToObject),
        'Autres': otherTypes.map(mapTypeToObject),
    };
}; 