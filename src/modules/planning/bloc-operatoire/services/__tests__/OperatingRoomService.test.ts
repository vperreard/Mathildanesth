import { OperatingRoomService } from '../OperatingRoomService';
import { blocPlanningService } from '../blocPlanningService';
import { OperatingRoom as BlocOperatingRoom } from '../../models/BlocModels';

// Mock du service blocPlanning
jest.mock('../blocPlanningService', () => ({
    blocPlanningService: {
        getAllOperatingRooms: jest.fn(),
        getActiveOperatingRooms: jest.fn()
    }
}));

describe('OperatingRoomService', () => {
    let service: OperatingRoomService;
    const mockBlocPlanningService = blocPlanningService as jest.Mocked<typeof blocPlanningService>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new OperatingRoomService();
    });

    describe('getAll', () => {
        it('should return all rooms mapped correctly', async () => {
            const mockRooms: BlocOperatingRoom[] = [
                {
                    id: 1,
                    number: 'OR001',
                    name: 'Salle Opératoire 1',
                    sectorId: 10,
                    isActive: true,
                    code: 'OR1',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    number: 'OR002',
                    name: 'Salle Opératoire 2',
                    sectorId: 20,
                    isActive: false,
                    code: 'OR2',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getAllOperatingRooms.mockResolvedValueOnce(mockRooms);

            const result = await service.getAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: '1',
                numero: 'OR001',
                nom: 'Salle Opératoire 1',
                secteurId: '10',
                description: undefined,
                estActif: true
            });
            expect(result[1]).toEqual({
                id: '2',
                numero: 'OR002',
                nom: 'Salle Opératoire 2',
                secteurId: '20',
                description: undefined,
                estActif: false
            });
            expect(mockBlocPlanningService.getAllOperatingRooms).toHaveBeenCalledWith(true);
        });

        it('should handle rooms without sector ID', async () => {
            const mockRooms: BlocOperatingRoom[] = [
                {
                    id: 1,
                    number: '',
                    name: 'Salle sans secteur',
                    sectorId: null,
                    isActive: true,
                    code: 'NS',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getAllOperatingRooms.mockResolvedValueOnce(mockRooms);

            const result = await service.getAll();

            expect(result[0].secteurId).toBe('0');
            expect(result[0].numero).toBe('');
        });

        it('should return empty array on error', async () => {
            mockBlocPlanningService.getAllOperatingRooms.mockRejectedValueOnce(new Error('Database error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.getAll();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Erreur lors de la récupération des salles via BlocPlanningService:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getById', () => {
        it('should return room by ID', async () => {
            const mockRooms: BlocOperatingRoom[] = [
                {
                    id: 1,
                    number: 'OR001',
                    name: 'Salle Opératoire 1',
                    sectorId: 10,
                    isActive: true,
                    code: 'OR1',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    number: 'OR002',
                    name: 'Salle Opératoire 2',
                    sectorId: 20,
                    isActive: false,
                    code: 'OR2',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getAllOperatingRooms.mockResolvedValueOnce(mockRooms);

            const result = await service.getById('1');

            expect(result).toEqual({
                id: '1',
                numero: 'OR001',
                nom: 'Salle Opératoire 1',
                secteurId: '10',
                description: undefined,
                estActif: true
            });
        });

        it('should return null for non-existing ID', async () => {
            mockBlocPlanningService.getAllOperatingRooms.mockResolvedValueOnce([]);

            const result = await service.getById('999');

            expect(result).toBeNull();
        });

        it('should handle invalid ID format', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const result = await service.getById('invalid');

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('ID de salle invalide fourni: invalid');

            consoleSpy.mockRestore();
        });

        it('should handle errors gracefully', async () => {
            mockBlocPlanningService.getAllOperatingRooms.mockRejectedValueOnce(new Error('Database error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.getById('1');

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                'Erreur lors de la récupération de la salle 1 via BlocPlanningService:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getActive', () => {
        it('should return only active rooms', async () => {
            const mockActiveRooms: BlocOperatingRoom[] = [
                {
                    id: 1,
                    number: 'OR001',
                    name: 'Salle Active',
                    sectorId: 10,
                    isActive: true,
                    code: 'OR1',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getActiveOperatingRooms.mockResolvedValueOnce(mockActiveRooms);

            const result = await service.getActive();

            expect(result).toHaveLength(1);
            expect(result[0].estActif).toBe(true);
            expect(mockBlocPlanningService.getActiveOperatingRooms).toHaveBeenCalledWith(true);
        });

        it('should return empty array on error', async () => {
            mockBlocPlanningService.getActiveOperatingRooms.mockRejectedValueOnce(new Error('Database error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.getActive();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Erreur lors de la récupération des salles actives:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('create', () => {
        it('should throw not implemented error', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            expect(() => {
                service.create({
                    numero: 'OR003',
                    nom: 'Nouvelle Salle',
                    secteurId: '30',
                    estActif: true
                });
            }).toThrow('Fonctionnalité non implémentée avec le nouveau service');

            expect(consoleSpy).toHaveBeenCalledWith(
                'OperatingRoomService.create non implémenté avec le nouveau service de backend.'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('update', () => {
        it('should throw not implemented error', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            expect(() => {
                service.update('1', { nom: 'Nouveau nom' });
            }).toThrow('Fonctionnalité non implémentée avec le nouveau service');

            expect(consoleSpy).toHaveBeenCalledWith(
                'OperatingRoomService.update non implémenté avec le nouveau service de backend.'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('delete', () => {
        it('should throw not implemented error', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            expect(() => {
                service.delete('1');
            }).toThrow('Fonctionnalité non implémentée avec le nouveau service');

            expect(consoleSpy).toHaveBeenCalledWith(
                'OperatingRoomService.delete non implémenté avec le nouveau service de backend.'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getBySector', () => {
        it('should return rooms for a specific sector', async () => {
            const mockRooms: BlocOperatingRoom[] = [
                {
                    id: 1,
                    number: 'OR001',
                    name: 'Salle Secteur 10',
                    sectorId: 10,
                    isActive: true,
                    code: 'OR1',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    number: 'OR002',
                    name: 'Salle Secteur 20',
                    sectorId: 20,
                    isActive: true,
                    code: 'OR2',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 3,
                    number: 'OR003',
                    name: 'Autre Salle Secteur 10',
                    sectorId: 10,
                    isActive: true,
                    code: 'OR3',
                    roomType: 'OPERATING',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getAllOperatingRooms.mockResolvedValueOnce(mockRooms);

            const result = await service.getBySector('10');

            expect(result).toHaveLength(2);
            expect(result.every(room => room.secteurId === '10')).toBe(true);
        });

        it('should return empty array for non-existing sector', async () => {
            mockBlocPlanningService.getAllOperatingRooms.mockResolvedValueOnce([]);

            const result = await service.getBySector('999');

            expect(result).toEqual([]);
        });

        it('should handle errors gracefully', async () => {
            mockBlocPlanningService.getAllOperatingRooms.mockRejectedValueOnce(new Error('Database error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.getBySector('10');

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Erreur lors de la récupération des salles via BlocPlanningService:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('deleteAllFromSector', () => {
        it('should throw not implemented error', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            expect(() => {
                service.deleteAllFromSector('10');
            }).toThrow('Fonctionnalité non implémentée avec le nouveau service');

            expect(consoleSpy).toHaveBeenCalledWith(
                'OperatingRoomService.deleteAllFromSector non implémenté avec le nouveau service de backend.'
            );

            consoleSpy.mockRestore();
        });
    });
});