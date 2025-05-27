import { useCallback, useMemo } from 'react';
import { DayOfWeek, Period } from '@prisma/client';
import { REGLES_AFFECTATION } from '../constants/reglesAffectation';

interface ValidationContext {
    supervisorId: number;
    rooms: Array<{
        id: number;
        sectorId: number;
        name: string;
    }>;
    sectors: Array<{
        id: number;
        name: string;
        sectorType: string;
        supervisionRules?: {
            maxRoomsPerSupervisor: number;
            requiresContiguousRooms: boolean;
            compatibleSectors: string[];
        };
    }>;
    existingAssignments: Array<{
        supervisorId: number;
        roomId: number;
        day: DayOfWeek;
        period: Period;
        roleType: 'ANESTHESIA' | 'SUPERVISION';
    }>;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions?: string[];
}

export const useValidationRules = () => {
    // Vérifier le nombre maximum de salles supervisées
    const validateMaxRooms = useCallback((
        context: ValidationContext,
        newRoomId: number,
        day: DayOfWeek,
        period: Period
    ): ValidationResult => {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Compter les salles actuellement supervisées
        const supervisedRooms = context.existingAssignments.filter(
            a => a.supervisorId === context.supervisorId &&
                 a.day === day &&
                 a.period === period
        );

        const newRoom = context.rooms.find(r => r.id === newRoomId);
        const newSector = context.sectors.find(s => s.id === newRoom?.sectorId);
        
        if (!newSector) {
            result.isValid = false;
            result.errors.push('Secteur introuvable pour cette salle');
            return result;
        }

        const maxRooms = newSector.supervisionRules?.maxRoomsPerSupervisor || 
                        REGLES_AFFECTATION.supervision.maxSallesParDefaut;

        if (supervisedRooms.length >= maxRooms) {
            result.isValid = false;
            result.errors.push(
                `Limite atteinte: ${maxRooms} salles maximum pour le secteur ${newSector.name}`
            );
            
            if (supervisedRooms.length === 2 && maxRooms === 3) {
                result.suggestions = [
                    'Une 3ème salle est possible mais déconseillée',
                    'Privilégier la supervision pure sans anesthésie pour 3 salles'
                ];
            }
        }

        // Avertissement si proche de la limite
        if (supervisedRooms.length === maxRooms - 1) {
            result.warnings.push(
                `Attention: Vous atteignez la limite de ${maxRooms} salles pour ce secteur`
            );
        }

        return result;
    }, []);

    // Vérifier la contiguïté des salles
    const validateRoomContiguity = useCallback((
        context: ValidationContext,
        newRoomId: number,
        day: DayOfWeek,
        period: Period
    ): ValidationResult => {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const newRoom = context.rooms.find(r => r.id === newRoomId);
        const newSector = context.sectors.find(s => s.id === newRoom?.sectorId);

        if (!newSector?.supervisionRules?.requiresContiguousRooms) {
            return result; // Pas de contrainte de contiguïté
        }

        // Récupérer les salles déjà supervisées
        const supervisedRoomIds = context.existingAssignments
            .filter(a => 
                a.supervisorId === context.supervisorId &&
                a.day === day &&
                a.period === period
            )
            .map(a => a.roomId);

        if (supervisedRoomIds.length === 0) {
            return result; // Première salle, pas de contrainte
        }

        // Vérifier la contiguïté (simplifiée - à adapter selon votre logique)
        const roomNumbers = [...supervisedRoomIds, newRoomId]
            .map(id => {
                const room = context.rooms.find(r => r.id === id);
                const match = room?.name.match(/\d+/);
                return match ? parseInt(match[0]) : null;
            })
            .filter(n => n !== null) as number[];

        roomNumbers.sort((a, b) => a - b);
        
        let isContiguous = true;
        for (let i = 1; i < roomNumbers.length; i++) {
            if (roomNumbers[i] - roomNumbers[i-1] > 1) {
                isContiguous = false;
                break;
            }
        }

        if (!isContiguous) {
            result.isValid = false;
            result.errors.push(
                `Les salles doivent être contiguës dans le secteur ${newSector.name}`
            );
            result.suggestions = [
                'Sélectionnez des salles adjacentes',
                'Exemple: Salle 1 et Salle 2, ou Salle 3 et Salle 4'
            ];
        }

        return result;
    }, []);

    // Vérifier la compatibilité des secteurs
    const validateSectorCompatibility = useCallback((
        context: ValidationContext,
        newRoomId: number,
        day: DayOfWeek,
        period: Period
    ): ValidationResult => {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const newRoom = context.rooms.find(r => r.id === newRoomId);
        const newSector = context.sectors.find(s => s.id === newRoom?.sectorId);

        if (!newSector) {
            result.isValid = false;
            result.errors.push('Secteur introuvable');
            return result;
        }

        // Récupérer les secteurs déjà supervisés
        const supervisedSectorTypes = new Set<string>();
        context.existingAssignments
            .filter(a => 
                a.supervisorId === context.supervisorId &&
                a.day === day &&
                a.period === period
            )
            .forEach(a => {
                const room = context.rooms.find(r => r.id === a.roomId);
                const sector = context.sectors.find(s => s.id === room?.sectorId);
                if (sector) {
                    supervisedSectorTypes.add(sector.sectorType);
                }
            });

        if (supervisedSectorTypes.size === 0) {
            return result; // Première affectation
        }

        // Vérifier la compatibilité selon les règles
        const compatibleTypes = newSector.supervisionRules?.compatibleSectors || 
                               REGLES_AFFECTATION.compatibiliteSecteurs[newSector.sectorType] || 
                               [];

        for (const existingType of supervisedSectorTypes) {
            if (existingType !== newSector.sectorType && !compatibleTypes.includes(existingType)) {
                result.isValid = false;
                result.errors.push(
                    `Incompatibilité: ${newSector.sectorType} ne peut pas être supervisé avec ${existingType}`
                );
                result.suggestions = [
                    `Secteurs compatibles avec ${newSector.sectorType}: ${compatibleTypes.join(', ') || 'Aucun'}`
                ];
            }
        }

        // Avertissement pour supervision multi-secteurs
        if (supervisedSectorTypes.size > 0 && !supervisedSectorTypes.has(newSector.sectorType)) {
            result.warnings.push(
                'Supervision multi-secteurs: vérifiez la proximité physique des salles'
            );
        }

        return result;
    }, []);

    // Vérifier les conflits avec d'autres affectations
    const validateNoConflicts = useCallback((
        context: ValidationContext,
        roleType: 'ANESTHESIA' | 'SUPERVISION',
        roomId: number,
        day: DayOfWeek,
        period: Period
    ): ValidationResult => {
        const result: ValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Vérifier si le superviseur a déjà une affectation incompatible
        const existingAssignments = context.existingAssignments.filter(
            a => a.supervisorId === context.supervisorId &&
                 a.day === day &&
                 a.period === period
        );

        // Règle: Un superviseur faisant l'anesthésie peut superviser maximum 1 autre salle
        const anesthesiaAssignments = existingAssignments.filter(a => a.roleType === 'ANESTHESIA');
        const supervisionAssignments = existingAssignments.filter(a => a.roleType === 'SUPERVISION');

        if (roleType === 'ANESTHESIA') {
            if (anesthesiaAssignments.length > 0) {
                result.isValid = false;
                result.errors.push(
                    'Un superviseur ne peut faire l\'anesthésie que dans une seule salle'
                );
            }
            if (supervisionAssignments.length > 1) {
                result.warnings.push(
                    'Attention: Faire l\'anesthésie tout en supervisant plusieurs salles est déconseillé'
                );
            }
        }

        // Vérifier si la salle est déjà occupée
        const roomOccupied = context.existingAssignments.find(
            a => a.roomId === roomId &&
                 a.day === day &&
                 a.period === period &&
                 a.roleType === 'ANESTHESIA'
        );

        if (roomOccupied && roleType === 'ANESTHESIA') {
            result.isValid = false;
            result.errors.push(
                'Cette salle a déjà un anesthésiste pour cette période'
            );
        }

        return result;
    }, []);

    // Validation globale
    const validateAssignment = useCallback((
        context: ValidationContext,
        attribution: {
            roomId: number;
            roleType: 'ANESTHESIA' | 'SUPERVISION';
            day: DayOfWeek;
            period: Period;
        }
    ): ValidationResult => {
        const results: ValidationResult[] = [
            validateMaxRooms(context, attribution.roomId, attribution.day, attribution.period),
            validateRoomContiguity(context, attribution.roomId, attribution.day, attribution.period),
            validateSectorCompatibility(context, attribution.roomId, attribution.day, attribution.period),
            validateNoConflicts(context, attribution.roleType, attribution.roomId, attribution.day, attribution.period)
        ];

        // Fusionner tous les résultats
        const finalResult: ValidationResult = {
            isValid: results.every(r => r.isValid),
            errors: results.flatMap(r => r.errors),
            warnings: results.flatMap(r => r.warnings),
            suggestions: results.flatMap(r => r.suggestions || [])
        };

        return finalResult;
    }, [validateMaxRooms, validateRoomContiguity, validateSectorCompatibility, validateNoConflicts]);

    // Obtenir des suggestions d'amélioration
    const getSuggestions = useCallback((
        context: ValidationContext,
        day: DayOfWeek,
        period: Period
    ): string[] => {
        const suggestions: string[] = [];

        // Analyser la charge actuelle
        const supervisorLoad = context.existingAssignments.filter(
            a => a.supervisorId === context.supervisorId &&
                 a.day === day &&
                 a.period === period
        ).length;

        if (supervisorLoad === 0) {
            suggestions.push('Commencez par les salles prioritaires ou complexes');
        } else if (supervisorLoad === 1) {
            suggestions.push('Privilégiez une salle contiguë pour faciliter la supervision');
        } else if (supervisorLoad >= 2) {
            suggestions.push('Considérez la supervision pure sans anesthésie pour plus d\'efficacité');
        }

        return suggestions;
    }, []);

    return {
        validateAssignment,
        validateMaxRooms,
        validateRoomContiguity,
        validateSectorCompatibility,
        validateNoConflicts,
        getSuggestions
    };
};

// Constantes exportées pour référence
export const REGLES_AFFECTATION = {
    supervision: {
        maxSallesParDefaut: 2,
        maxSallesExceptionnel: 3,
        preferenceSupervisionPure: 3 // À partir de 3 salles
    },
    compatibiliteSecteurs: {
        'GENERAL': ['GENERAL'],
        'OPHTHALMOLOGY': ['GENERAL', 'OPHTHALMOLOGY'],
        'ENDOSCOPY': ['ENDOSCOPY'],
        'CARDIAC': ['CARDIAC'],
        'NEURO': ['NEURO'],
        'PEDIATRIC': ['PEDIATRIC', 'GENERAL'],
        'OBSTETRIC': ['OBSTETRIC']
    } as Record<string, string[]>
};