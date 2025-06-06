import { Attribution } from '../types/attribution';
import { RulesConfiguration } from '../types/rules';

interface ValidationResult {
    isValid: boolean;
    violations: unknown[];
}

/**
 * Valide un ensemble d'gardes/vacations selon les règles configurées
 * @param attributions Liste des gardes/vacations à valider
 * @param rules Configuration des règles à appliquer
 * @returns Résultat de la validation avec les violations éventuelles
 */
export function validateAssignments(
    attributions: Attribution[],
    rules: RulesConfiguration
): ValidationResult {
    const violations: unknown[] = [];

    // Vérifier les conflits d'horaire (même médecin, même jour)
    const userDayMap: Record<string, Attribution[]> = {};

    // Regrouper par utilisateur et jour
    attributions.forEach(attribution => {
        const dateStr = attribution.date instanceof Date
            ? attribution.date.toISOString().split('T')[0]
            : typeof attribution.date === 'string'
                ? attribution.date
                : new Date(attribution.date).toISOString().split('T')[0];

        const key = `${attribution.userId}-${dateStr}`;

        if (!userDayMap[key]) {
            userDayMap[key] = [];
        }

        userDayMap[key].push(attribution);
    });

    // Identifier les conflits
    Object.entries(userDayMap).forEach(([key, dayAssignments]) => {
        if (dayAssignments.length > 1) {
            violations.push({
                id: `conflict-${key}`,
                type: 'CONFLICT_SCHEDULE',
                message: `Un médecin a plusieurs gardes/vacations le même jour`,
                attributions: dayAssignments.map(a => a.id)
            });
        }
    });

    // Vérifier l'intervalle minimum entre gardes
    if (rules.minDaysBetweenAssignments && rules.minDaysBetweenAssignments > 0) {
        // Regrouper les gardes/vacations par médecin
        const userAssignments: Record<number, Attribution[]> = {};
        attributions.forEach(attribution => {
            if (!userAssignments[attribution.userId]) {
                userAssignments[attribution.userId] = [];
            }
            userAssignments[attribution.userId].push(attribution);
        });

        // Vérifier les intervalles pour chaque médecin
        Object.entries(userAssignments).forEach(([userId, userAssigns]) => {
            const sortedAssignments = [...userAssigns].sort((a, b) => {
                const dateA = a.date instanceof Date ? a.date : new Date(a.date);
                const dateB = b.date instanceof Date ? b.date : new Date(b.date);
                return dateA.getTime() - dateB.getTime();
            });

            for (let i = 1; i < sortedAssignments.length; i++) {
                const prevDate = sortedAssignments[i - 1].date instanceof Date
                    ? sortedAssignments[i - 1].date
                    : new Date(sortedAssignments[i - 1].date);

                const currDate = sortedAssignments[i].date instanceof Date
                    ? sortedAssignments[i].date
                    : new Date(sortedAssignments[i].date);

                const daysBetween = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysBetween < rules.minDaysBetweenAssignments) {
                    violations.push({
                        id: `interval-${sortedAssignments[i - 1].id}-${sortedAssignments[i].id}`,
                        type: 'INTERVAL_TOO_SHORT',
                        message: `Intervalle entre gardes insuffisant (${daysBetween} jours au lieu de ${rules.minDaysBetweenAssignments} minimum)`,
                        attributions: [sortedAssignments[i - 1].id, sortedAssignments[i].id]
                    });
                }
            }
        });
    }

    // Vérifier le nombre maximum d'gardes/vacations par mois
    if (rules.maxAssignmentsPerMonth && rules.maxAssignmentsPerMonth > 0) {
        const monthlyCountByUser: Record<string, number> = {};

        attributions.forEach(attribution => {
            const date = attribution.date instanceof Date
                ? attribution.date
                : new Date(attribution.date);
            const monthKey = `${attribution.userId}-${date.getFullYear()}-${date.getMonth()}`;

            if (!monthlyCountByUser[monthKey]) {
                monthlyCountByUser[monthKey] = 0;
            }

            monthlyCountByUser[monthKey]++;
        });

        Object.entries(monthlyCountByUser).forEach(([key, count]) => {
            if (count > (rules.maxAssignmentsPerMonth || 0)) {
                const [userId, year, month] = key.split('-');
                violations.push({
                    id: `max-monthly-${key}`,
                    type: 'MAX_MONTHLY_EXCEEDED',
                    message: `Trop d'gardes/vacations pour le mois (${count} au lieu de ${rules.maxAssignmentsPerMonth} maximum)`,
                    user: userId,
                    period: `${year}-${parseInt(month) + 1}`
                });
            }
        });
    }

    return {
        isValid: violations.length === 0,
        violations
    };
} 