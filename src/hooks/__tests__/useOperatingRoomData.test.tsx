import { renderHook, act, waitFor } from '@testing-library/react';
import { useOperatingRoomData } from '../useOperatingRoomData';
import { blocPlanningService } from '@/services/blocPlanningService';

// Mock du service blocPlanningService
jest.mock('@/services/blocPlanningService', () => ({
    blocPlanningService: {
        getAllOperatingRooms: jest.fn(),
        getOperatingRoomById: jest.fn(),
        createOperatingRoom: jest.fn(),
        updateOperatingRoom: jest.fn(),
        deleteOperatingRoom: jest.fn(),
        getAllSectors: jest.fn()
    }
}));

// Mocks des données pour les tests
const mockOperatingRooms = [
    {
        id: 'room1',
        numero: '101',
        secteurId: 'sector1',
        estActif: true,
        nom: 'Salle A'
    },
    {
        id: 'room2',
        numero: '102',
        secteurId: 'sector1',
        estActif: true,
        nom: 'Salle B'
    }
];

const mockSectors = [
    {
        id: 'sector1',
        nom: 'Chirurgie Orthopédique',
        salles: ['room1', 'room2'],
        couleur: '#FF0000',
        estActif: true
    },
    {
        id: 'sector2',
        nom: 'Chirurgie Cardiaque',
        salles: [],
        couleur: '#00FF00',
        estActif: true
    }
];

describe('useOperatingRoomData Hook', () => {
    // Réinitialiser les mocks avant chaque test
    beforeEach(() => {
        jest.clearAllMocks();

        // Configurer les mocks par défaut
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockResolvedValue(mockOperatingRooms);
        (blocPlanningService.getAllSectors as jest.Mock).mockResolvedValue(mockSectors);
        (blocPlanningService.getOperatingRoomById as jest.Mock).mockImplementation((id) =>
            Promise.resolve(mockOperatingRooms.find(room => room.id === id) || null)
        );
    });

    test('charge les données initiales lors du montage', async () => {
        // Rendu du hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Vérifier l'état initial
        expect(result.current[0].isLoading).toBe(true);
        expect(result.current[0].error).toBe(null);

        // Attendre que les données soient disponibles plutôt que isLoading=false
        await waitFor(() => expect(result.current[0].rooms.length).toBeGreaterThan(0));

        // Vérifier que les méthodes du service ont été appelées
        expect(blocPlanningService.getAllOperatingRooms).toHaveBeenCalledTimes(1);
        expect(blocPlanningService.getAllSectors).toHaveBeenCalledTimes(1);

        // Vérifier que les données ont été chargées correctement
        expect(result.current[0].rooms).toEqual(mockOperatingRooms);
        expect(result.current[0].sectors).toEqual(mockSectors);
    });

    test('gère les erreurs lors du chargement des données', async () => {
        // Configurer le mock pour simuler une erreur
        const errorMessage = 'Erreur de chargement des données';
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockRejectedValue(new Error(errorMessage));

        // Rendu du hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que l'erreur soit définie plutôt que isLoading=false
        await waitFor(() => expect(result.current[0].error).not.toBeNull());

        // Vérifier que l'erreur a été capturée correctement
        expect(result.current[0].error).toBeInstanceOf(Error);
        expect(result.current[0].error?.message).toBe(errorMessage);
    });

    test('fetchRoomById récupère une salle par son ID', async () => {
        // Rendu du hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que les données soient disponibles
        await waitFor(() => expect(result.current[0].rooms.length).toBeGreaterThan(0));

        // Récupérer une salle par son ID
        let fetchedRoom;
        await act(async () => {
            fetchedRoom = await result.current[1].fetchRoomById('room1');
        });

        // Vérifier que la méthode du service a été appelée avec le bon ID
        expect(blocPlanningService.getOperatingRoomById).toHaveBeenCalledWith('room1');

        // Vérifier que la salle a été récupérée correctement
        expect(fetchedRoom).toEqual(mockOperatingRooms[0]);
    });

    test('createRoom crée une nouvelle salle', async () => {
        // Configurer le mock pour simuler la création d'une salle
        const newRoom = {
            id: 'room3',
            numero: '103',
            secteurId: 'sector1',
            estActif: true,
            nom: 'Nouvelle Salle Test'
        };
        (blocPlanningService.createOperatingRoom as jest.Mock).mockResolvedValue(newRoom);

        // Rendu du hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que les données initiales soient chargées
        await waitFor(() => expect(result.current[0].rooms.length).toBeGreaterThan(0));

        // Créer une nouvelle salle
        let createdRoom;
        await act(async () => {
            createdRoom = await result.current[1].createRoom({
                numero: '103',
                secteurId: 'sector1',
                estActif: true,
                nom: 'Nouvelle Salle Test'
            });
        });

        // Vérifier que la méthode du service a été appelée avec les bonnes données
        expect(blocPlanningService.createOperatingRoom).toHaveBeenCalledWith({
            numero: '103',
            secteurId: 'sector1',
            estActif: true,
            nom: 'Nouvelle Salle Test'
        });

        // Vérifier que la salle a été créée et ajoutée à l'état
        expect(createdRoom).toEqual(newRoom);
        expect(result.current[0].rooms).toContainEqual(newRoom);
    });

    test('updateRoom met à jour une salle existante', async () => {
        // Configurer le mock pour simuler la mise à jour d'une salle
        const updatedRoom = {
            ...mockOperatingRooms[0],
            nom: 'Salle A Modifiée'
        };
        (blocPlanningService.updateOperatingRoom as jest.Mock).mockResolvedValue(updatedRoom);

        // Rendu du hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que les données initiales soient chargées
        await waitFor(() => expect(result.current[0].rooms.length).toBeGreaterThan(0));

        // Mettre à jour une salle
        let resultRoom;
        await act(async () => {
            resultRoom = await result.current[1].updateRoom('room1', { nom: 'Salle A Modifiée' });
        });

        // Vérifier que la méthode du service a été appelée avec les bonnes données
        expect(blocPlanningService.updateOperatingRoom).toHaveBeenCalledWith('room1', { nom: 'Salle A Modifiée' });

        // Vérifier que la salle a été mise à jour dans l'état
        expect(resultRoom).toEqual(updatedRoom);
        expect(result.current[0].rooms.find(room => room.id === 'room1')).toEqual(updatedRoom);
    });

    test('deleteRoom supprime une salle', async () => {
        // Configurer le mock pour simuler la suppression d'une salle
        (blocPlanningService.deleteOperatingRoom as jest.Mock).mockResolvedValue(true);

        // Rendu du hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que les données initiales soient chargées
        await waitFor(() => expect(result.current[0].rooms.length).toBeGreaterThan(0));

        // Supprimer une salle
        let success;
        await act(async () => {
            success = await result.current[1].deleteRoom('room1');
        });

        // Vérifier que la méthode du service a été appelée avec le bon ID
        expect(blocPlanningService.deleteOperatingRoom).toHaveBeenCalledWith('room1');

        // Vérifier que la salle a été supprimée de l'état
        expect(success).toBe(true);
        expect(result.current[0].rooms.find(room => room.id === 'room1')).toBeUndefined();
    });

    test('gère les erreurs lors de la création d\'une salle', async () => {
        // Configurer le mock pour simuler une erreur
        const errorMessage = 'Erreur de création de salle';
        (blocPlanningService.createOperatingRoom as jest.Mock).mockRejectedValue(new Error(errorMessage));

        // Rendu du hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que les données initiales soient chargées
        await waitFor(() => expect(result.current[0].rooms.length).toBeGreaterThan(0));

        // Tenter de créer une salle (doit échouer)
        try {
            await act(async () => {
                try {
                    await result.current[1].createRoom({
                        numero: '103',
                        secteurId: 'sector1',
                        estActif: true,
                        nom: 'Salle Erreur'
                    });
                } catch (e) {
                    // Nous capturons l'erreur ici mais ne faisons rien
                    // car nous vérifions l'état du hook plus tard
                }
            });
        } catch (error) {
            // Capturer l'erreur au niveau act
        }

        // Vérifier que l'erreur a été correctement capturée
        await waitFor(() => expect(result.current[0].error).not.toBeNull());
        expect(result.current[0].error?.message).toBe(errorMessage);
    });
}); 