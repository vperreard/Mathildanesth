import { Request } from './requestUtils';

/**
 * Formate une plage de dates pour l'affichage
 * 
 * @param startDate Date de début (format ISO)
 * @param endDate Date de fin (format ISO)
 * @param format Format d'affichage (court ou long)
 * @returns Chaîne formatée
 */
export function formatDateRange(startDate: string, endDate: string, format: 'short' | 'long' = 'long'): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (format === 'short') {
        // Format court: "1-5 jan" ou "25 déc - 2 jan" si mois différents
        const startDay = start.getDate();
        const endDay = end.getDate();
        const startMonth = start.getMonth();
        const endMonth = end.getMonth();

        if (startMonth === endMonth) {
            return `${startDay}-${endDay} ${start.toLocaleDateString('fr-FR', { month: 'short' })}`;
        } else {
            return `${startDay} ${start.toLocaleDateString('fr-FR', { month: 'short' })} - ${endDay} ${end.toLocaleDateString('fr-FR', { month: 'short' })}`;
        }
    } else {
        // Format long: "1 janvier - 5 janvier 2023" ou "25 décembre 2023 - 2 janvier 2024" si années différentes
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();

        if (startYear === endYear) {
            return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        } else {
            return `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        }
    }
}

/**
 * Compare deux plages de dates pour savoir si elles sont identiques
 * 
 * @param range1 Première plage de dates
 * @param range2 Deuxième plage de dates
 * @returns true si les plages sont identiques
 */
export function areDateRangesEqual(
    range1: { start: string; end: string },
    range2: { start: string; end: string }
): boolean {
    return range1.start === range2.start && range1.end === range2.end;
}

/**
 * Groupe les requêtes qui ont exactement les mêmes dates
 * Utile pour affichage compact des absences
 * 
 * @param requests Liste des requêtes à grouper
 * @returns Liste des groupes de requêtes par dates identiques
 */
export function groupOverlappingRequests(requests: Request[]): {
    users: string[];
    dates: { start: string; end: string };
}[] {
    const groups: {
        users: string[];
        dates: { start: string; end: string };
    }[] = [];

    // Parcourir toutes les requêtes
    requests.forEach(request => {
        if (!request.dates) return;

        // Chercher un groupe existant avec les mêmes dates
        const existingGroupIndex = groups.findIndex(group =>
            areDateRangesEqual(group.dates, request.dates!)
        );

        if (existingGroupIndex >= 0) {
            // Ajouter l'utilisateur au groupe existant
            groups[existingGroupIndex].users.push(getShortName(request.userName));
        } else {
            // Créer un nouveau groupe
            groups.push({
                users: [getShortName(request.userName)],
                dates: request.dates
            });
        }
    });

    return groups;
}

/**
 * Récupère un nom court pour l'affichage compact
 * Ex: "Dr. Jean Dupont" -> "J. Dupont"
 * 
 * @param fullName Nom complet
 * @returns Nom court
 */
function getShortName(fullName: string): string {
    const parts = fullName.split(' ');

    // Ignorer les préfixes comme "Dr."
    if (parts[0].endsWith('.') && parts.length > 2) {
        return `${parts[1][0]}. ${parts[2]}`;
    }

    // Format standard: Prénom Nom -> P. Nom
    if (parts.length >= 2) {
        return `${parts[0][0]}. ${parts[1]}`;
    }

    return fullName;
} 