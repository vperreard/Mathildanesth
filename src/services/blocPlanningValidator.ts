import { BlocDayPlanning, BlocRoomAssignment, BlocSupervisor, ValidationResult } from '@/types/bloc-planning-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Valide un planning journalier du bloc opératoire
 */
export function validateDayPlanning(planning: BlocDayPlanning, options?: { maxSallesParMAR?: number }): ValidationResult {
    // Résultat initial
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        infos: []
    };

    // Vérifier si chaque salle a un superviseur principal
    planning.salles.forEach(salle => {
        const hasPrincipalSupervisor = salle.superviseurs && salle.superviseurs.some(sup => sup.role === 'PRINCIPAL');

        if (!hasPrincipalSupervisor) {
            result.errors.push({
                id: uuidv4(),
                type: 'SUPERVISEUR_PRINCIPAL_REQUIS',
                code: 'SUPERVISEUR_PRINCIPAL_REQUIS',
                description: `La salle ${salle.salleId} n'a pas de superviseur principal`,
                severite: 'ERREUR',
                entitesAffectees: [{ type: 'SALLE', id: salle.salleId }],
                estResolu: false
            });
        }
    });

    // Vérifier le nombre maximum de salles par MAR
    const maxSallesParMAR = options?.maxSallesParMAR || 2;
    const supervisorRooms: Map<string, string[]> = new Map();

    // Comptabiliser les salles par superviseur
    planning.salles.forEach(salle => {
        salle.superviseurs.forEach(superviseur => {
            const supervisorId = superviseur.userId;
            const rooms = supervisorRooms.get(supervisorId) || [];
            if (!rooms.includes(salle.salleId)) {
                rooms.push(salle.salleId);
                supervisorRooms.set(supervisorId, rooms);
            }
        });
    });

    // Vérifier si un superviseur a trop de salles
    supervisorRooms.forEach((rooms, supervisorId) => {
        if (rooms.length > maxSallesParMAR) {
            result.errors.push({
                id: uuidv4(),
                type: 'MAX_SALLES_MAR',
                code: 'MAX_SALLES_MAR',
                description: `Le superviseur ${supervisorId} est assigné à trop de salles (${rooms.length} > ${maxSallesParMAR})`,
                severite: 'ERREUR',
                entitesAffectees: [{ type: 'SUPERVISEUR', id: supervisorId }],
                estResolu: false
            });
        }
    });

    // Vérifier les chevauchements de périodes pour chaque superviseur
    const supervisorPeriods: Map<string, Array<{ debut: string, fin: string, salleId: string }>> = new Map();

    planning.salles.forEach(salle => {
        salle.superviseurs.forEach(superviseur => {
            const supervisorId = superviseur.userId;
            const periods = supervisorPeriods.get(supervisorId) || [];

            superviseur.periodes.forEach(periode => {
                periods.push({
                    ...periode,
                    salleId: salle.salleId
                });
            });

            supervisorPeriods.set(supervisorId, periods);
        });
    });

    supervisorPeriods.forEach((periods, supervisorId) => {
        for (let i = 0; i < periods.length; i++) {
            for (let j = i + 1; j < periods.length; j++) {
                const periodeA = periods[i];
                const periodeB = periods[j];

                // Si les périodes sont pour des salles différentes et qu'elles se chevauchent
                if (periodeA.salleId !== periodeB.salleId &&
                    periodeA.debut < periodeB.fin && periodeA.fin > periodeB.debut) {
                    result.errors.push({
                        id: uuidv4(),
                        type: 'CHEVAUCHEMENT_PERIODES',
                        code: 'CHEVAUCHEMENT_PERIODES',
                        description: `Chevauchement de périodes pour le superviseur ${supervisorId} entre ${periodeA.debut}-${periodeA.fin} et ${periodeB.debut}-${periodeB.fin}`,
                        severite: 'ERREUR',
                        entitesAffectees: [{ type: 'SUPERVISEUR', id: supervisorId }],
                        estResolu: false
                    });
                }
            }
        }
    });

    // Le planning est valide s'il n'y a pas d'erreurs
    result.isValid = result.errors.length === 0;

    return result;
}

/**
 * Valide les assignations de superviseurs
 */
export function validateSupervisorAssignments(supervisors: BlocSupervisor[]): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        infos: []
    };

    // Vérification des chevauchements de périodes par superviseur
    const supervisorPeriods: Map<string, Array<{ debut: string, fin: string }>> = new Map();

    supervisors.forEach(superviseur => {
        const userId = superviseur.userId;
        const periods = supervisorPeriods.get(userId) || [];

        superviseur.periodes.forEach(periode => {
            periods.push(periode);
        });

        supervisorPeriods.set(userId, periods);
    });

    supervisorPeriods.forEach((periods, userId) => {
        for (let i = 0; i < periods.length; i++) {
            for (let j = i + 1; j < periods.length; j++) {
                const periodeA = periods[i];
                const periodeB = periods[j];

                if (periodeA.debut < periodeB.fin && periodeA.fin > periodeB.debut) {
                    result.errors.push({
                        id: uuidv4(),
                        type: 'CHEVAUCHEMENT_PERIODES',
                        code: 'CHEVAUCHEMENT_PERIODES',
                        description: `Chevauchement de périodes pour le superviseur ${userId}`,
                        severite: 'ERREUR',
                        entitesAffectees: [{ type: 'SUPERVISEUR', id: userId }],
                        estResolu: false
                    });
                }
            }
        }
    });

    // Le planning est valide s'il n'y a pas d'erreurs
    result.isValid = result.errors.length === 0;

    return result;
} 