import { useState, useCallback, useMemo } from 'react';
import { supervisionRulesService } from '../services/SupervisionRulesService';
import { operatingRoomService } from '../services/OperatingRoomService';
import { OperatingAssignment, OperatingRoom } from '../types';

type SupervisionAssignment = {
    doctorId: string;
    roomIds: string[];
    sectorIds: Set<string>;
};

type ValidationResult = {
    isValid: boolean;
    violations: {
        type: 'MAX_ROOMS' | 'INCOMPATIBLE_SECTORS' | 'CONTIGUOUS_REQUIREMENT' | 'MISSING_SKILLS' | 'OTHER';
        message: string;
        doctorId?: string;
        roomIds?: string[];
    }[];
    warnings: {
        message: string;
        doctorId?: string;
        details?: string;
    }[];
};

/**
 * Hook pour vérifier le respect des règles de supervision
 * Permet de valider les assignations de salles aux médecins selon les règles configurées
 */
export const useSupervisionValidation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Extrait les assignations de supervision à partir des assignments
     * @param assignments Assignations d'opérations
     * @returns Map des docteurs avec leurs salles supervisées
     */
    const extractSupervisorAssignments = (assignments: OperatingAssignment[]): Map<string, SupervisionAssignment> => {
        const supervisorMap = new Map<string, SupervisionAssignment>();

        assignments.forEach(assignment => {
            // Si pas de chirurgien assigné, ignorer
            if (!assignment.chirurgienId) return;

            const doctorId = assignment.chirurgienId;
            const roomId = assignment.salleId;

            // Récupérer la salle pour connaître son secteur
            const room = operatingRoomService.getById(roomId);
            if (!room) return;

            if (!supervisorMap.has(doctorId)) {
                supervisorMap.set(doctorId, {
                    doctorId,
                    roomIds: [roomId],
                    sectorIds: new Set([room.secteurId])
                });
            } else {
                const currentAssignment = supervisorMap.get(doctorId)!;
                currentAssignment.roomIds.push(roomId);
                currentAssignment.sectorIds.add(room.secteurId);
            }
        });

        return supervisorMap;
    };

    /**
     * Vérifie si les assignations respectent la limite de salles par médecin
     * @param supervisorMap Map des docteurs avec leurs salles supervisées
     * @returns Violations détectées
     */
    const checkMaxRoomsConstraint = (supervisorMap: Map<string, SupervisionAssignment>): ValidationResult['violations'] => {
        const violations: ValidationResult['violations'] = [];

        supervisorMap.forEach((assignment) => {
            const { doctorId, roomIds, sectorIds } = assignment;

            // Calculer le nombre max de salles autorisées pour ce médecin
            const maxRooms = supervisionRulesService.getMaxRoomsForDoctor(Array.from(sectorIds));

            if (roomIds.length > maxRooms) {
                violations.push({
                    type: 'MAX_ROOMS',
                    message: `Le MAR ${doctorId} supervise ${roomIds.length} salles, mais le maximum autorisé est ${maxRooms}`,
                    doctorId,
                    roomIds: roomIds
                });
            }
        });

        return violations;
    };

    /**
     * Vérifie la compatibilité des secteurs supervisés par un même médecin
     * @param supervisorMap Map des docteurs avec leurs salles supervisées
     * @returns Violations détectées
     */
    const checkSectorCompatibility = (supervisorMap: Map<string, SupervisionAssignment>): ValidationResult['violations'] => {
        const violations: ValidationResult['violations'] = [];

        supervisorMap.forEach((assignment) => {
            const { doctorId, sectorIds } = assignment;

            // Pour chaque paire de secteurs, vérifier leur compatibilité
            const sectorsArray = Array.from(sectorIds);

            for (let i = 0; i < sectorsArray.length; i++) {
                for (let j = i + 1; j < sectorsArray.length; j++) {
                    const sector1 = sectorsArray[i];
                    const sector2 = sectorsArray[j];

                    if (!supervisionRulesService.areSectorsCompatible(sector1, sector2)) {
                        violations.push({
                            type: 'INCOMPATIBLE_SECTORS',
                            message: `Le MAR ${doctorId} supervise des secteurs incompatibles`,
                            doctorId,
                            roomIds: assignment.roomIds
                        });

                        // On ne continue pas à vérifier d'autres paires pour ce médecin
                        break;
                    }
                }
            }
        });

        return violations;
    };

    /**
     * Vérifie si les salles supervisées respectent la contrainte de contiguïté
     * @param supervisorMap Map des docteurs avec leurs salles supervisées
     * @returns Violations détectées
     */
    const checkContiguityConstraint = (supervisorMap: Map<string, SupervisionAssignment>): ValidationResult['violations'] => {
        // Cette vérification nécessiterait une connaissance de la disposition spatiale des salles
        // Pour l'instant, on implémente une vérification simplifiée basée sur les numéros de salle
        // assumant que des numéros consécutifs indiquent des salles contiguës

        const violations: ValidationResult['violations'] = [];

        supervisorMap.forEach((assignment) => {
            const { doctorId, roomIds, sectorIds } = assignment;

            // Vérifier si la contiguïté est requise pour les secteurs supervisés
            const requiresContiguity = Array.from(sectorIds).some(sectorId => {
                const rules = supervisionRulesService.getRulesForSector(sectorId);
                return rules.some(rule => rule.conditions.supervisionContigues);
            });

            if (requiresContiguity && roomIds.length > 1) {
                // Récupérer les numéros de salles
                const rooms = roomIds.map(id => operatingRoomService.getById(id))
                    .filter((room): room is OperatingRoom => !!room)
                    .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));

                // Vérifier si les numéros sont consécutifs
                let isContiguous = true;
                for (let i = 1; i < rooms.length; i++) {
                    // Logique simplifiée pour la démonstration
                    // Dans un cas réel, il faudrait une méthode plus sophistiquée
                    const prevNum = parseInt(rooms[i - 1].numero.replace(/\D/g, ''));
                    const currNum = parseInt(rooms[i].numero.replace(/\D/g, ''));

                    if (isNaN(prevNum) || isNaN(currNum) || currNum - prevNum !== 1) {
                        isContiguous = false;
                        break;
                    }
                }

                if (!isContiguous) {
                    violations.push({
                        type: 'CONTIGUOUS_REQUIREMENT',
                        message: `Le MAR ${doctorId} supervise des salles non contiguës alors que c'est requis`,
                        doctorId,
                        roomIds: roomIds
                    });
                }
            }
        });

        return violations;
    };

    /**
     * Valide les assignations par rapport aux règles de supervision
     * @param assignments Assignations à valider
     * @returns Résultat de la validation
     */
    const validateAssignments = useCallback((assignments: OperatingAssignment[]): ValidationResult => {
        setLoading(true);
        setError(null);

        try {
            const supervisorMap = extractSupervisorAssignments(assignments);

            // Vérifier les différentes contraintes
            const maxRoomsViolations = checkMaxRoomsConstraint(supervisorMap);
            const sectorCompatibilityViolations = checkSectorCompatibility(supervisorMap);
            const contiguityViolations = checkContiguityConstraint(supervisorMap);

            // Agréger toutes les violations
            const allViolations = [
                ...maxRoomsViolations,
                ...sectorCompatibilityViolations,
                ...contiguityViolations
            ];

            // Générer des avertissements (non bloquants)
            const warnings = [];

            // Vérifier s'il y a des médecins avec beaucoup de salles
            supervisorMap.forEach((assignment, doctorId) => {
                if (assignment.roomIds.length >= 3) {
                    warnings.push({
                        message: `Le MAR ${doctorId} supervise ${assignment.roomIds.length} salles`,
                        doctorId,
                        details: `Charge de travail élevée`
                    });
                }
            });

            return {
                isValid: allViolations.length === 0,
                violations: allViolations,
                warnings
            };
        } catch (err) {
            console.error("Erreur lors de la validation des règles de supervision", err);
            setError("Erreur lors de la validation des règles de supervision");

            return {
                isValid: false,
                violations: [{
                    type: 'OTHER',
                    message: "Erreur technique lors de la validation"
                }],
                warnings: []
            };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Suggère des corrections pour résoudre les violations
     * @param currentAssignments Assignations actuelles
     * @param violations Violations détectées
     * @returns Suggestions de corrections
     */
    const suggestCorrections = useCallback((
        currentAssignments: OperatingAssignment[],
        violations: ValidationResult['violations']
    ): { message: string; action: string }[] => {
        const suggestions: { message: string; action: string }[] = [];

        // Pour chaque violation, proposer une correction spécifique
        violations.forEach(violation => {
            switch (violation.type) {
                case 'MAX_ROOMS':
                    if (violation.doctorId && violation.roomIds) {
                        suggestions.push({
                            message: `Trop de salles (${violation.roomIds.length}) supervisées par le MAR ${violation.doctorId}`,
                            action: "Réassigner certaines salles à un autre MAR"
                        });
                    }
                    break;

                case 'INCOMPATIBLE_SECTORS':
                    if (violation.doctorId) {
                        suggestions.push({
                            message: `Secteurs incompatibles supervisés par le MAR ${violation.doctorId}`,
                            action: "Réassigner les salles de l'un des secteurs à un autre MAR"
                        });
                    }
                    break;

                case 'CONTIGUOUS_REQUIREMENT':
                    if (violation.doctorId) {
                        suggestions.push({
                            message: `Salles non contiguës supervisées par le MAR ${violation.doctorId}`,
                            action: "Réorganiser les assignations pour respecter la contiguïté"
                        });
                    }
                    break;

                default:
                    suggestions.push({
                        message: violation.message,
                        action: "Vérifier et corriger manuellement"
                    });
            }
        });

        return suggestions;
    }, []);

    // Exposer l'API du hook
    return {
        validateAssignments,
        suggestCorrections,
        loading,
        error
    };
};

export default useSupervisionValidation; 