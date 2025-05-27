import { renderHook } from '@testing-library/react';
import { DayOfWeek, Period } from '@prisma/client';
import { useValidationRules } from '../useValidationRules';
import { TestFactory } from '@/tests/factories/testFactorySimple';

describe('useValidationRules', () => {
    const { result } = renderHook(() => useValidationRules());

    describe('validateMaxRooms', () => {
        it('devrait accepter jusqu\'à 2 salles par défaut', () => {
            const context = TestFactory.createValidationContext({
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    }
                ]
            });

            const validation = result.current.validateMaxRooms(
                context,
                2,
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('devrait rejeter plus de 2 salles', () => {
            const context = TestFactory.createValidationContext({
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    },
                    {
                        supervisorId: 1,
                        roomId: 2,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    }
                ]
            });

            const validation = result.current.validateMaxRooms(
                context,
                3,
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                'Limite atteinte: 2 salles maximum pour le secteur Secteur Test'
            );
        });

        it('devrait avertir quand proche de la limite', () => {
            const context = TestFactory.createValidationContext({
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    }
                ]
            });

            const validation = result.current.validateMaxRooms(
                context,
                2,
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(true);
            expect(validation.warnings).toContain(
                'Attention: Vous atteignez la limite de 2 salles pour ce secteur'
            );
        });
    });

    describe('validateRoomContiguity', () => {
        it('devrait accepter des salles contiguës', () => {
            const context = TestFactory.createValidationContext({
                rooms: [
                    TestFactory.createOperatingRoom({ id: 1, name: 'Salle 1', sectorId: 1 }),
                    TestFactory.createOperatingRoom({ id: 2, name: 'Salle 2', sectorId: 1 }),
                    TestFactory.createOperatingRoom({ id: 3, name: 'Salle 3', sectorId: 1 })
                ],
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    }
                ]
            });

            const validation = result.current.validateRoomContiguity(
                context,
                2,
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('devrait rejeter des salles non contiguës', () => {
            const context = TestFactory.createValidationContext({
                rooms: [
                    TestFactory.createOperatingRoom({ id: 1, name: 'Salle 1', sectorId: 1 }),
                    TestFactory.createOperatingRoom({ id: 2, name: 'Salle 2', sectorId: 1 }),
                    TestFactory.createOperatingRoom({ id: 3, name: 'Salle 3', sectorId: 1 })
                ],
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    }
                ]
            });

            const validation = result.current.validateRoomContiguity(
                context,
                3, // Salle 3 n'est pas contiguë à Salle 1
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                'Les salles doivent être contiguës dans le secteur Secteur Test'
            );
        });

        it('devrait ignorer la contiguïté si non requise', () => {
            const context = TestFactory.createValidationContext({
                sectors: [
                    TestFactory.createOperatingSector({
                        id: 1,
                        supervisionRules: {
                            maxRoomsPerSupervisor: 2,
                            requiresContiguousRooms: false,
                            compatibleSectors: []
                        }
                    })
                ]
            });

            const validation = result.current.validateRoomContiguity(
                context,
                3,
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(true);
        });
    });

    describe('validateSectorCompatibility', () => {
        it('devrait accepter des secteurs compatibles', () => {
            const context = TestFactory.createValidationContext({
                sectors: [
                    TestFactory.createOperatingSector({ id: 1, sectorType: 'GENERAL' }),
                    TestFactory.createOperatingSector({ 
                        id: 2, 
                        sectorType: 'PEDIATRIC',
                        supervisionRules: {
                            maxRoomsPerSupervisor: 2,
                            requiresContiguousRooms: false,
                            compatibleSectors: ['GENERAL', 'PEDIATRIC']
                        }
                    })
                ],
                rooms: [
                    TestFactory.createOperatingRoom({ id: 1, sectorId: 1 }),
                    TestFactory.createOperatingRoom({ id: 2, sectorId: 2 })
                ],
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    }
                ]
            });

            const validation = result.current.validateSectorCompatibility(
                context,
                2, // Salle du secteur pédiatrique
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(true);
        });

        it('devrait rejeter des secteurs incompatibles', () => {
            const context = TestFactory.createValidationContext({
                sectors: [
                    TestFactory.createOperatingSector({ id: 1, sectorType: 'GENERAL' }),
                    TestFactory.createOperatingSector({ 
                        id: 2, 
                        sectorType: 'ENDOSCOPY',
                        supervisionRules: {
                            maxRoomsPerSupervisor: 2,
                            requiresContiguousRooms: false,
                            compatibleSectors: ['ENDOSCOPY']
                        }
                    })
                ],
                rooms: [
                    TestFactory.createOperatingRoom({ id: 1, sectorId: 1 }),
                    TestFactory.createOperatingRoom({ id: 2, sectorId: 2 })
                ],
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    }
                ]
            });

            const validation = result.current.validateSectorCompatibility(
                context,
                2, // Salle du secteur endoscopie
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                'Incompatibilité: ENDOSCOPY ne peut pas être supervisé avec GENERAL'
            );
        });
    });

    describe('validateNoConflicts', () => {
        it('devrait empêcher l\'anesthésie dans plusieurs salles', () => {
            const context = TestFactory.createValidationContext({
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'ANESTHESIA'
                    }
                ]
            });

            const validation = result.current.validateNoConflicts(
                context,
                'ANESTHESIA',
                2,
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                'Un superviseur ne peut faire l\'anesthésie que dans une seule salle'
            );
        });

        it('devrait détecter une salle déjà occupée', () => {
            const context = TestFactory.createValidationContext({
                existingAssignments: [
                    {
                        supervisorId: 2,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'ANESTHESIA'
                    }
                ]
            });

            const validation = result.current.validateNoConflicts(
                context,
                'ANESTHESIA',
                1, // Même salle
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                'Cette salle a déjà un anesthésiste pour cette période'
            );
        });
    });

    describe('validateAssignment', () => {
        it('devrait valider une affectation complète', () => {
            const context = TestFactory.createValidationContext();

            const validation = result.current.validateAssignment(context, {
                roomId: 1,
                roleType: 'SUPERVISION',
                day: DayOfWeek.MONDAY,
                period: Period.MORNING
            });

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('devrait accumuler toutes les erreurs', () => {
            const context = TestFactory.createValidationContext({
                sectors: [
                    TestFactory.createOperatingSector({ 
                        id: 1, 
                        sectorType: 'GENERAL',
                        supervisionRules: {
                            maxRoomsPerSupervisor: 1,
                            requiresContiguousRooms: true,
                            compatibleSectors: ['GENERAL']
                        }
                    })
                ],
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'ANESTHESIA'
                    }
                ]
            });

            const validation = result.current.validateAssignment(context, {
                roomId: 2,
                roleType: 'ANESTHESIA',
                day: DayOfWeek.MONDAY,
                period: Period.MORNING
            });

            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(1);
        });
    });

    describe('getSuggestions', () => {
        it('devrait suggérer de commencer par les salles prioritaires', () => {
            const context = TestFactory.createValidationContext();

            const suggestions = result.current.getSuggestions(
                context,
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(suggestions).toContain(
                'Commencez par les salles prioritaires ou complexes'
            );
        });

        it('devrait suggérer des salles contiguës', () => {
            const context = TestFactory.createValidationContext({
                existingAssignments: [
                    {
                        supervisorId: 1,
                        roomId: 1,
                        day: DayOfWeek.MONDAY,
                        period: Period.MORNING,
                        roleType: 'SUPERVISION'
                    }
                ]
            });

            const suggestions = result.current.getSuggestions(
                context,
                DayOfWeek.MONDAY,
                Period.MORNING
            );

            expect(suggestions).toContain(
                'Privilégiez une salle contiguë pour faciliter la supervision'
            );
        });
    });
});