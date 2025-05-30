import {
    ActivityCategory,
    SectorCategory,
    Period,
    RoomType,
    ActivityType,
    OperatingSector,
    OperatingRoom,
    CreateActivityTypeData,
    CreateSectorData,
    UpdateActivityTypeData,
    UpdateSectorData,
    ActivityTypeStats,
    SectorStats
} from '../activityTypes';

describe('Types: ActivityTypes', () => {
    describe('ActivityCategory enum', () => {
        it('should have all expected activity categories', () => {
            expect(ActivityCategory.BLOC_OPERATOIRE).toBe('BLOC_OPERATOIRE');
            expect(ActivityCategory.CONSULTATION).toBe('CONSULTATION');
            expect(ActivityCategory.GARDE).toBe('GARDE');
            expect(ActivityCategory.ASTREINTE).toBe('ASTREINTE');
            expect(ActivityCategory.REUNION).toBe('REUNION');
            expect(ActivityCategory.FORMATION).toBe('FORMATION');
            expect(ActivityCategory.ADMINISTRATIF).toBe('ADMINISTRATIF');
            expect(ActivityCategory.AUTRE).toBe('AUTRE');
        });

        it('should have 8 activity categories', () => {
            const categories = Object.values(ActivityCategory);
            expect(categories).toHaveLength(8);
        });
    });

    describe('SectorCategory enum', () => {
        it('should have all expected sector categories', () => {
            expect(SectorCategory.STANDARD).toBe('STANDARD');
            expect(SectorCategory.HYPERASEPTIQUE).toBe('HYPERASEPTIQUE');
            expect(SectorCategory.OPHTALMOLOGIE).toBe('OPHTALMOLOGIE');
            expect(SectorCategory.ENDOSCOPIE).toBe('ENDOSCOPIE');
        });

        it('should have 4 sector categories', () => {
            const categories = Object.values(SectorCategory);
            expect(categories).toHaveLength(4);
        });
    });

    describe('Period enum', () => {
        it('should have all expected periods', () => {
            expect(Period.MATIN).toBe('MATIN');
            expect(Period.APRES_MIDI).toBe('APRES_MIDI');
            expect(Period.JOURNEE_ENTIERE).toBe('JOURNEE_ENTIERE');
        });

        it('should have 3 periods', () => {
            const periods = Object.values(Period);
            expect(periods).toHaveLength(3);
        });
    });

    describe('RoomType enum', () => {
        it('should have all expected room types', () => {
            expect(RoomType.STANDARD).toBe('STANDARD');
            expect(RoomType.FIV).toBe('FIV');
            expect(RoomType.CONSULTATION).toBe('CONSULTATION');
        });

        it('should have 3 room types', () => {
            const types = Object.values(RoomType);
            expect(types).toHaveLength(3);
        });
    });

    describe('ActivityType interface', () => {
        it('should allow creating a basic activity type', () => {
            const activityType: ActivityType = {
                id: 'activity-1',
                name: 'Garde de jour',
                category: ActivityCategory.GARDE,
                isActive: true,
                code: 'GARDE_JOUR',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(activityType.id).toBe('activity-1');
            expect(activityType.name).toBe('Garde de jour');
            expect(activityType.category).toBe(ActivityCategory.GARDE);
            expect(activityType.isActive).toBe(true);
        });

        it('should support optional fields', () => {
            const activityType: ActivityType = {
                id: 'activity-2',
                name: 'Consultation spécialisée',
                description: 'Consultation pré-opératoire',
                category: ActivityCategory.CONSULTATION,
                color: '#3498db',
                icon: 'stethoscope',
                isActive: true,
                code: 'CONSULT_PREOP',
                defaultDurationHours: 2,
                defaultPeriod: Period.MATIN,
                siteId: 'site-1',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(activityType.description).toBe('Consultation pré-opératoire');
            expect(activityType.color).toBe('#3498db');
            expect(activityType.icon).toBe('stethoscope');
            expect(activityType.defaultDurationHours).toBe(2);
            expect(activityType.defaultPeriod).toBe(Period.MATIN);
            expect(activityType.siteId).toBe('site-1');
        });
    });

    describe('OperatingSector interface', () => {
        it('should allow creating a basic operating sector', () => {
            const sector: OperatingSector = {
                id: 1,
                name: 'Secteur A',
                isActive: true,
                category: SectorCategory.STANDARD,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(sector.id).toBe(1);
            expect(sector.name).toBe('Secteur A');
            expect(sector.isActive).toBe(true);
            expect(sector.category).toBe(SectorCategory.STANDARD);
        });

        it('should support optional fields', () => {
            const sector: OperatingSector = {
                id: 2,
                name: 'Secteur Hyperaseptique',
                colorCode: '#e74c3c',
                isActive: true,
                description: 'Secteur pour chirurgies nécessitant une asepsie maximale',
                rules: {
                    maxDurationHours: 8,
                    requiresSpecialTraining: true,
                    sterilizationProtocol: 'ENHANCED'
                },
                displayOrder: 1,
                siteId: 'site-1',
                category: SectorCategory.HYPERASEPTIQUE,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(sector.colorCode).toBe('#e74c3c');
            expect(sector.description).toContain('asepsie');
            expect(sector.rules?.maxDurationHours).toBe(8);
            expect(sector.displayOrder).toBe(1);
            expect(sector.siteId).toBe('site-1');
        });
    });

    describe('OperatingRoom interface', () => {
        it('should allow creating a basic operating room', () => {
            const room: OperatingRoom = {
                id: 1,
                name: 'Salle 101',
                number: '101',
                roomType: RoomType.STANDARD,
                capacity: 2,
                isActive: true,
                displayOrder: 1,
                allowedSpecialties: ['anesthesie', 'chirurgie'],
                siteId: 'site-1',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(room.id).toBe(1);
            expect(room.name).toBe('Salle 101');
            expect(room.number).toBe('101');
            expect(room.roomType).toBe(RoomType.STANDARD);
            expect(room.capacity).toBe(2);
            expect(room.allowedSpecialties).toContain('anesthesie');
        });

        it('should support operating sector relationship', () => {
            const sector: OperatingSector = {
                id: 1,
                name: 'Secteur A',
                isActive: true,
                category: SectorCategory.STANDARD,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const room: OperatingRoom = {
                id: 2,
                name: 'Salle FIV 1',
                number: 'FIV1',
                description: 'Salle spécialisée FIV',
                roomType: RoomType.FIV,
                capacity: 1,
                isActive: true,
                displayOrder: 2,
                colorCode: '#9b59b6',
                supervisionRules: {
                    requiresSeniorResident: true,
                    maxStudents: 1
                },
                allowedSpecialties: ['gynecologie', 'fiv'],
                siteId: 'site-1',
                operatingSectorId: 1,
                operatingSector: sector,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(room.roomType).toBe(RoomType.FIV);
            expect(room.supervisionRules?.requiresSeniorResident).toBe(true);
            expect(room.operatingSectorId).toBe(1);
            expect(room.operatingSector?.name).toBe('Secteur A');
        });
    });

    describe('CreateActivityTypeData interface', () => {
        it('should require mandatory fields only', () => {
            const createData: CreateActivityTypeData = {
                name: 'Nouvelle activité',
                category: ActivityCategory.FORMATION,
                code: 'FORMATION_NEW'
            };

            expect(createData.name).toBe('Nouvelle activité');
            expect(createData.category).toBe(ActivityCategory.FORMATION);
            expect(createData.code).toBe('FORMATION_NEW');
        });

        it('should support optional fields', () => {
            const createData: CreateActivityTypeData = {
                name: 'Réunion administrative',
                description: 'Réunion mensuelle équipe',
                category: ActivityCategory.ADMINISTRATIF,
                color: '#95a5a6',
                icon: 'meeting',
                code: 'REUNION_ADMIN',
                defaultDurationHours: 1,
                defaultPeriod: Period.APRES_MIDI,
                siteId: 'site-1'
            };

            expect(createData.description).toBe('Réunion mensuelle équipe');
            expect(createData.defaultDurationHours).toBe(1);
            expect(createData.defaultPeriod).toBe(Period.APRES_MIDI);
        });
    });

    describe('CreateSectorData interface', () => {
        it('should require mandatory fields only', () => {
            const createData: CreateSectorData = {
                name: 'Nouveau secteur',
                category: SectorCategory.ENDOSCOPIE
            };

            expect(createData.name).toBe('Nouveau secteur');
            expect(createData.category).toBe(SectorCategory.ENDOSCOPIE);
        });

        it('should support all optional fields', () => {
            const createData: CreateSectorData = {
                name: 'Secteur Ophtalmologie',
                description: 'Secteur dédié aux interventions ophtalmologiques',
                category: SectorCategory.OPHTALMOLOGIE,
                colorCode: '#f39c12',
                displayOrder: 3,
                siteId: 'site-2',
                rules: {
                    specialEquipment: ['microscope', 'laser'],
                    maxPatientsPerDay: 15
                }
            };

            expect(createData.description).toContain('ophtalmologiques');
            expect(createData.rules?.specialEquipment).toContain('microscope');
        });
    });

    describe('Update interfaces', () => {
        it('should allow partial updates for ActivityType', () => {
            const updateData: UpdateActivityTypeData = {
                name: 'Nom modifié',
                isActive: false
            };

            expect(updateData.name).toBe('Nom modifié');
            expect(updateData.isActive).toBe(false);
        });

        it('should allow partial updates for Sector', () => {
            const updateData: UpdateSectorData = {
                colorCode: '#2ecc71',
                isActive: true,
                displayOrder: 5
            };

            expect(updateData.colorCode).toBe('#2ecc71');
            expect(updateData.isActive).toBe(true);
            expect(updateData.displayOrder).toBe(5);
        });
    });

    describe('Statistics interfaces', () => {
        it('should create ActivityTypeStats correctly', () => {
            const stats: ActivityTypeStats = {
                activityTypeId: 'activity-1',
                activityTypeName: 'Garde de nuit',
                totalAssignments: 150,
                activeAssignments: 25,
                averageDuration: 12,
                mostUsedPeriod: Period.JOURNEE_ENTIERE,
                usageByMonth: {
                    '2024-01': 12,
                    '2024-02': 15,
                    '2024-03': 18
                }
            };

            expect(stats.totalAssignments).toBe(150);
            expect(stats.activeAssignments).toBe(25);
            expect(stats.averageDuration).toBe(12);
            expect(stats.mostUsedPeriod).toBe(Period.JOURNEE_ENTIERE);
            expect(stats.usageByMonth['2024-02']).toBe(15);
        });

        it('should create SectorStats correctly', () => {
            const stats: SectorStats = {
                sectorId: 1,
                sectorName: 'Secteur Principal',
                totalRooms: 8,
                activeRooms: 6,
                utilization: 75.5,
                mostUsedRoom: 'Salle 102',
                capacityUtilization: 82.3
            };

            expect(stats.sectorId).toBe(1);
            expect(stats.totalRooms).toBe(8);
            expect(stats.activeRooms).toBe(6);
            expect(stats.utilization).toBe(75.5);
            expect(stats.mostUsedRoom).toBe('Salle 102');
            expect(stats.capacityUtilization).toBe(82.3);
        });
    });

    describe('Type integration and validation', () => {
        it('should validate enum compatibility', () => {
            const activityType: ActivityType = {
                id: 'test',
                name: 'Test',
                category: ActivityCategory.BLOC_OPERATOIRE,
                isActive: true,
                code: 'TEST',
                defaultPeriod: Period.MATIN,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const sector: OperatingSector = {
                id: 1,
                name: 'Test Sector',
                isActive: true,
                category: SectorCategory.STANDARD,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const room: OperatingRoom = {
                id: 1,
                name: 'Test Room',
                number: 'T1',
                roomType: RoomType.STANDARD,
                capacity: 1,
                isActive: true,
                displayOrder: 1,
                allowedSpecialties: ['test'],
                siteId: 'test-site',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(Object.values(ActivityCategory)).toContain(activityType.category);
            expect(Object.values(Period)).toContain(activityType.defaultPeriod);
            expect(Object.values(SectorCategory)).toContain(sector.category);
            expect(Object.values(RoomType)).toContain(room.roomType);
        });

        it('should support JSON serialization', () => {
            const activityType: ActivityType = {
                id: 'json-test',
                name: 'JSON Test',
                category: ActivityCategory.AUTRE,
                isActive: true,
                code: 'JSON_TEST',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-02')
            };

            const json = JSON.stringify(activityType);
            const parsed = JSON.parse(json);

            expect(parsed.id).toBe('json-test');
            expect(parsed.category).toBe(ActivityCategory.AUTRE);
            expect(parsed.isActive).toBe(true);
        });

        it('should filter by category correctly', () => {
            const activities: ActivityType[] = [
                {
                    id: '1',
                    name: 'Garde',
                    category: ActivityCategory.GARDE,
                    isActive: true,
                    code: 'G1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    name: 'Consultation',
                    category: ActivityCategory.CONSULTATION,
                    isActive: true,
                    code: 'C1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '3',
                    name: 'Formation',
                    category: ActivityCategory.FORMATION,
                    isActive: false,
                    code: 'F1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const guardeActivities = activities.filter(a => a.category === ActivityCategory.GARDE);
            const activeActivities = activities.filter(a => a.isActive);
            const consultationActivities = activities.filter(a => a.category === ActivityCategory.CONSULTATION);

            expect(guardeActivities).toHaveLength(1);
            expect(activeActivities).toHaveLength(2);
            expect(consultationActivities).toHaveLength(1);
        });
    });
});