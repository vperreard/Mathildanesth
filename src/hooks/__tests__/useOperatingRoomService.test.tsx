import { renderHook, act, waitFor } from '@testing-library/react';
import { useOperatingRoomData } from '../useOperatingRoomData';
import { blocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';

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

describe('Interactions useOperatingRoomData et blocPlanningService', () => {
    // Données pour les tests
    const mockRooms = [
        { id: 'room1', numero: '101', secteurId: 'sector1', estActif: true, nom: 'Salle A' },
        { id: 'room2', numero: '102', secteurId: 'sector1', estActif: true, nom: 'Salle B' }
    ];

    const mockSectors = [
        { id: 'sector1', nom: 'Chirurgie', couleur: '#FF0000', estActif: true, salles: ['room1', 'room2'] }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        // Configuration par défaut des mocks
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockResolvedValue([]);
        (blocPlanningService.getAllSectors as jest.Mock).mockResolvedValue([]);
    });

    test('le hook appelle les méthodes du service lors de l\'initialisation', async () => {
        // Configurer les mocks pour ce test
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockResolvedValue(mockRooms);
        (blocPlanningService.getAllSectors as jest.Mock).mockResolvedValue(mockSectors);

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Le hook doit charger les données automatiquement au démarrage
        // Appeler fetchRooms et fetchSectors manuellement
        await act(async () => {
            await result.current[1].fetchRooms();
            await result.current[1].fetchSectors();
        });

        // Vérifier que les méthodes du service ont été appelées
        expect(blocPlanningService.getAllOperatingRooms).toHaveBeenCalledTimes(1);
        expect(blocPlanningService.getAllSectors).toHaveBeenCalledTimes(1);

        // Vérifier que les données du hook correspondent aux données mockées
        expect(result.current[0].rooms).toEqual(mockRooms);
        expect(result.current[0].sectors).toEqual(mockSectors);
    });

    test('fetchRooms appelle getAllOperatingRooms et met à jour l\'état', async () => {
        // Configurer le mock pour ce test
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockResolvedValue(mockRooms);

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que l'initialisation soit terminée
        await waitFor(() => expect(blocPlanningService.getAllOperatingRooms).toHaveBeenCalled());

        // Réinitialiser les mocks pour le test spécifique
        jest.clearAllMocks();
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockResolvedValue([...mockRooms, {
            id: 'room3', numero: '103', secteurId: 'sector1', estActif: true, nom: 'Salle C'
        }]);

        // Appeler fetchRooms explicitement
        await act(async () => {
            await result.current[1].fetchRooms();
        });

        // Vérifier que la méthode du service a été appelée
        expect(blocPlanningService.getAllOperatingRooms).toHaveBeenCalledTimes(1);

        // Vérifier que l'état a été mis à jour avec les nouvelles données
        expect(result.current[0].rooms).toHaveLength(3);
        expect(result.current[0].rooms[2].id).toBe('room3');
    });

    test('createRoom appelle createOperatingRoom et met à jour l\'état', async () => {
        // Configurer le mock pour ce test
        const newRoom = {
            id: 'room-new',
            numero: '105',
            secteurId: 'sector1',
            estActif: true,
            nom: 'Nouvelle Salle'
        };
        (blocPlanningService.createOperatingRoom as jest.Mock).mockResolvedValue(newRoom);

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Charger les données initiales
        await act(async () => {
            await result.current[1].fetchRooms();
        });

        // Données initiales pour mieux voir les changements
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockResolvedValue(mockRooms);
        await act(async () => {
            await result.current[1].fetchRooms();
        });

        // Réinitialiser les mocks pour le test spécifique
        jest.clearAllMocks();

        // Appeler createRoom
        let createdRoom;
        await act(async () => {
            createdRoom = await result.current[1].createRoom({
                numero: '105',
                secteurId: 'sector1',
                estActif: true,
                nom: 'Nouvelle Salle'
            });
        });

        // Vérifier que la méthode du service a été appelée avec les bons paramètres
        expect(blocPlanningService.createOperatingRoom).toHaveBeenCalledTimes(1);
        expect(blocPlanningService.createOperatingRoom).toHaveBeenCalledWith({
            numero: '105',
            secteurId: 'sector1',
            estActif: true,
            nom: 'Nouvelle Salle'
        });

        // Vérifier que l'état a été mis à jour avec la nouvelle salle
        expect(result.current[0].rooms).toContainEqual(newRoom);
        expect(createdRoom).toEqual(newRoom);
    });

    test('deleteRoom appelle deleteOperatingRoom et met à jour l\'état', async () => {
        // Configurer les mocks pour ce test
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockResolvedValue(mockRooms);
        (blocPlanningService.deleteOperatingRoom as jest.Mock).mockResolvedValue(true);

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que les données soient chargées
        await waitFor(() => {
            expect(result.current[0].isLoading).toBe(false);
            expect(result.current[0].rooms).toHaveLength(2);
        });

        // Réinitialiser les mocks pour le test spécifique
        jest.clearAllMocks();

        // Supprimer une salle
        let success;
        await act(async () => {
            success = await result.current[1].deleteRoom('room1');
        });

        // Vérifier que la méthode du service a été appelée avec le bon ID
        expect(blocPlanningService.deleteOperatingRoom).toHaveBeenCalledTimes(1);
        expect(blocPlanningService.deleteOperatingRoom).toHaveBeenCalledWith('room1');

        // Vérifier que l'état a été mis à jour (la salle a été supprimée)
        expect(result.current[0].rooms).toHaveLength(1);
        expect(result.current[0].rooms[0].id).toBe('room2');
        expect(success).toBe(true);
    });

    test('gestion des erreurs du service', async () => {
        // Configurer le mock pour simuler une erreur
        const errorMessage = 'Erreur lors de la récupération des salles';
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockRejectedValue(new Error(errorMessage));

        // Rendre le hook
        const { result } = renderHook(() => useOperatingRoomData());

        // Attendre que l'erreur soit capturée
        await waitFor(() => expect(result.current[0].error).not.toBeNull());

        // Vérifier que l'erreur a été correctement gérée
        expect(result.current[0].isLoading).toBe(false);
        expect(result.current[0].error?.message).toBe(errorMessage);

        // Vérifier que l'erreur n'empêche pas d'autres actions
        // Par exemple, tester si getAllSectors a été appelé malgré l'erreur sur getAllOperatingRooms
        expect(blocPlanningService.getAllSectors).toHaveBeenCalled();
    });

    test('le hook gère correctement les timeouts et annulations', async () => {
        // Configurer un mock qui ne se résout jamais (simule un timeout)
        (blocPlanningService.getAllOperatingRooms as jest.Mock).mockImplementation(() => {
            return new Promise((resolve) => {
                // Ne jamais résoudre pour simuler un timeout
                setTimeout(() => resolve([]), 10000);
            });
        });

        // Rendre le hook puis le démonter immédiatement pour simuler une annulation
        const { result, unmount } = renderHook(() => useOperatingRoomData());

        // Vérifier que le hook est en état de chargement
        expect(result.current[0].isLoading).toBe(true);

        // Démonter le composant (simuler une navigation ou un changement de page)
        unmount();

        // Vérifier qu'aucune erreur n'est levée
        // Ce test passe si aucune erreur n'est levée pendant le démontage
        expect(true).toBe(true);
    });
}); 