/**
 * Formate une plage de dates pour l'affichage
 *
 * @param startDate Date de début (format ISO)
 * @param endDate Date de fin (format ISO)
 * @param format Format d'affichage (court ou long)
 * @returns Chaîne formatée
 */
export function formatDateRange(startDate, endDate, format) {
    if (format === void 0) { format = 'long'; }
    var start = new Date(startDate);
    var end = new Date(endDate);
    if (format === 'short') {
        // Format court: "1-5 jan" ou "25 déc - 2 jan" si mois différents
        var startDay = start.getDate();
        var endDay = end.getDate();
        var startMonth = start.getMonth();
        var endMonth = end.getMonth();
        if (startMonth === endMonth) {
            return "".concat(startDay, "-").concat(endDay, " ").concat(start.toLocaleDateString('fr-FR', { month: 'short' }));
        }
        else {
            return "".concat(startDay, " ").concat(start.toLocaleDateString('fr-FR', { month: 'short' }), " - ").concat(endDay, " ").concat(end.toLocaleDateString('fr-FR', { month: 'short' }));
        }
    }
    else {
        // Format long: "1 janvier - 5 janvier 2023" ou "25 décembre 2023 - 2 janvier 2024" si années différentes
        var startYear = start.getFullYear();
        var endYear = end.getFullYear();
        if (startYear === endYear) {
            return "".concat(start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }), " - ").concat(end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
        }
        else {
            return "".concat(start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), " - ").concat(end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
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
export function areDateRangesEqual(range1, range2) {
    return range1.start === range2.start && range1.end === range2.end;
}
/**
 * Groupe les requêtes qui ont exactement les mêmes dates
 * Utile pour affichage compact des absences
 *
 * @param requests Liste des requêtes à grouper
 * @returns Liste des groupes de requêtes par dates identiques
 */
export function groupOverlappingRequests(requests) {
    var groups = [];
    // Parcourir toutes les requêtes
    requests.forEach(function (request) {
        if (!request.dates)
            return;
        // Chercher un groupe existant avec les mêmes dates
        var existingGroupIndex = groups.findIndex(function (group) {
            return areDateRangesEqual(group.dates, request.dates);
        });
        if (existingGroupIndex >= 0) {
            // Ajouter l'utilisateur au groupe existant
            groups[existingGroupIndex].users.push(getShortName(request.userName));
        }
        else {
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
function getShortName(fullName) {
    var parts = fullName.split(' ');
    // Ignorer les préfixes comme "Dr."
    if (parts[0].endsWith('.') && parts.length > 2) {
        return "".concat(parts[1][0], ". ").concat(parts[2]);
    }
    // Format standard: Prénom Nom -> P. Nom
    if (parts.length >= 2) {
        return "".concat(parts[0][0], ". ").concat(parts[1]);
    }
    return fullName;
}
