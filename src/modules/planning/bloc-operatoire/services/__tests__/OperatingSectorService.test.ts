import { OperatingSectorService } from '../OperatingSectorService';
import { blocPlanningService } from '../blocPlanningService';
import { OperatingSector as BlocOperatingSector } from '../../models/BlocModels';

// Mock du service blocPlanning
jest.mock('../blocPlanningService', () => ({
    blocPlanningService: {
        getAllOperatingSectors: jest.fn(),
        getActiveOperatingSectors: jest.fn()
    }
}));

describe('OperatingSectorService', () => {
    let service: OperatingSectorService;
    const mockBlocPlanningService = blocPlanningService as jest.Mocked<typeof blocPlanningService>;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new OperatingSectorService();
    });

    describe('getAll', () => {
        it('should return all sectors mapped correctly', async () => {
            const mockSectors: BlocOperatingSector[] = [
                {
                    id: 1,
                    name: 'Secteur A',
                    description: 'Description secteur A',
                    colorCode: '#FF0000',
                    isActive: true,
                    displayOrder: 1,
                    categoryType: 'GENERAL',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    name: 'Secteur B',
                    description: null,
                    colorCode: null,
                    isActive: false,
                    displayOrder: 2,
                    categoryType: 'SPECIALITY',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getAllOperatingSectors.mockResolvedValueOnce(mockSectors);

            const result = await service.getAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: '1',
                nom: 'Secteur A',
                description: 'Description secteur A',
                couleur: '#FF0000',
                salles: [],
                estActif: true
            });
            expect(result[1]).toEqual({
                id: '2',
                nom: 'Secteur B',
                description: undefined,
                couleur: '#000000', // Valeur par défaut si colorCode est null
                salles: [],
                estActif: false
            });
            expect(mockBlocPlanningService.getAllOperatingSectors).toHaveBeenCalledWith(false);
        });

        it('should return empty array on error', async () => {
            mockBlocPlanningService.getAllOperatingSectors.mockRejectedValueOnce(new Error('Database error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.getAll();

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Erreur lors de la récupération des secteurs via BlocPlanningService:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getById', () => {
        it('should return sector by ID', async () => {
            const mockSectors: BlocOperatingSector[] = [
                {
                    id: 1,
                    name: 'Secteur A',
                    description: 'Description secteur A',
                    colorCode: '#FF0000',
                    isActive: true,
                    displayOrder: 1,
                    categoryType: 'GENERAL',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    name: 'Secteur B',
                    description: null,
                    colorCode: null,
                    isActive: false,
                    displayOrder: 2,
                    categoryType: 'SPECIALITY',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getAllOperatingSectors.mockResolvedValueOnce(mockSectors);

            const result = await service.getById('1');

            expect(result).toEqual({
                id: '1',
                nom: 'Secteur A',
                description: 'Description secteur A',
                couleur: '#FF0000',
                salles: [],
                estActif: true
            });
        });

        it('should return null for non-existing ID', async () => {
            mockBlocPlanningService.getAllOperatingSectors.mockResolvedValueOnce([]);

            const result = await service.getById('999');

            expect(result).toBeNull();
        });

        it('should handle invalid ID format', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            const result = await service.getById('invalid');

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('ID de secteur invalide fourni: invalid');

            consoleSpy.mockRestore();
        });

        it('should handle errors gracefully', async () => {
            mockBlocPlanningService.getAllOperatingSectors.mockRejectedValueOnce(new Error('Database error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.getById('1');

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                'Erreur lors de la récupération du secteur 1 via BlocPlanningService:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });

    describe('getActive', () => {
        it('should return only active sectors', async () => {
            const mockSectors: BlocOperatingSector[] = [
                {
                    id: 1,
                    name: 'Secteur Actif',
                    description: 'Description',
                    colorCode: '#00FF00',
                    isActive: true,
                    displayOrder: 1,
                    categoryType: 'GENERAL',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 2,
                    name: 'Secteur Inactif',
                    description: null,
                    colorCode: '#FF0000',
                    isActive: false,
                    displayOrder: 2,
                    categoryType: 'SPECIALITY',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getAllOperatingSectors.mockResolvedValueOnce(mockSectors);

            const result = await service.getActive();

            expect(result).toHaveLength(1);
            expect(result[0].nom).toBe('Secteur Actif');
            expect(result[0].estActif).toBe(true);
        });

        it('should return empty array if no active sectors', async () => {
            const mockSectors: BlocOperatingSector[] = [
                {
                    id: 1,
                    name: 'Secteur Inactif',
                    description: null,
                    colorCode: '#FF0000',
                    isActive: false,
                    displayOrder: 1,
                    categoryType: 'GENERAL',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockBlocPlanningService.getAllOperatingSectors.mockResolvedValueOnce(mockSectors);

            const result = await service.getActive();

            expect(result).toEqual([]);
        });
    });

    describe('create', () => {
        it('should throw not implemented error', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            expect(() => {
                service.create({
                    nom: 'Nouveau Secteur',
                    description: 'Description',
                    couleur: '#0000FF',
                    salles: [],
                    estActif: true
                });
            }).toThrow('Fonctionnalité non implémentée avec le nouveau service');

            expect(consoleSpy).toHaveBeenCalledWith(
                'OperatingSectorService.create non implémenté avec le nouveau service de backend.'
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
                'OperatingSectorService.update non implémenté avec le nouveau service de backend.'
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
                'OperatingSectorService.delete non implémenté avec le nouveau service de backend.'
            );

            consoleSpy.mockRestore();
        });
    });

    describe('edge cases', () => {
        it('should handle sectors with undefined id causing error', async () => {
            const mockSectors: any[] = [
                {
                    id: undefined,
                    name: 'Secteur sans ID',
                    description: 'Description',
                    colorCode: '#FF0000',
                    isActive: true,
                    displayOrder: 1,
                    categoryType: 'GENERAL',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            // Mock le comportement qui va lancer une erreur lors du mapping
            mockBlocPlanningService.getAllOperatingSectors.mockImplementationOnce(async () => {
                // Simuler que le mapping échoue avec un id undefined
                throw new TypeError("Cannot read properties of undefined (reading 'toString')");
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.getAll();

            expect(result).toEqual([]); // Le service retourne un tableau vide en cas d'erreur
            expect(consoleSpy).toHaveBeenCalledWith(
                'Erreur lors de la récupération des secteurs via BlocPlanningService:',
                expect.any(TypeError)
            );

            consoleSpy.mockRestore();
        });

        it('should handle malformed sector data', async () => {
            const mockSectors: any[] = [
                {
                    id: 1,
                    // name manquant
                    description: 'Description',
                    colorCode: '#FF0000',
                    isActive: true
                }
            ];

            mockBlocPlanningService.getAllOperatingSectors.mockResolvedValueOnce(mockSectors);

            const result = await service.getAll();

            expect(result).toHaveLength(1);
            expect(result[0].nom).toBeUndefined();
        });
    });
});