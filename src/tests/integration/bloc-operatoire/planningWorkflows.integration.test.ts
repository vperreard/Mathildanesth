import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BlocDayPlanning, OperatingRoom, BlocSector } from '@/types/bloc-planning-types';
import { blocPlanningService } from '@/services/blocPlanningService';
import BlocPlanningEditor from '@/app/bloc-operatoire/components/BlocPlanningEditor';
import CreateBlocPlanningPage from '@/app/bloc-operatoire/create/[date]/page';
import EditBlocPlanningPage from '@/app/bloc-operatoire/edit/[date]/page';

// Mock des dépendances
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        back: vi.fn(),
        refresh: vi.fn(),
    }),
    useParams: () => ({
        date: format(new Date(), 'yyyy-MM-dd'),
    }),
}));

vi.mock('@/services/blocPlanningService', () => ({
    blocPlanningService: {
        getAllOperatingRooms: vi.fn(),
        getAllSectors: vi.fn(),
        getAllSupervisionRules: vi.fn(),
        getDayPlanning: vi.fn(),
        saveDayPlanning: vi.fn(),
        getAvailableSupervisors: vi.fn(),
        validateDayPlanning: vi.fn(),
        deleteDayPlanning: vi.fn(),
        checkPlanningCompatibility: vi.fn(),
    },
}));

// Données de test
const mockSalles: OperatingRoom[] = [
    {
        id: 'salle-1',
        numero: '101',
        nom: 'Salle Orthopédie',
        secteurId: 'secteur-1',
        estActif: true,
    },
    {
        id: 'salle-2',
        numero: '102',
        nom: 'Salle Cardiologie',
        secteurId: 'secteur-2',
        estActif: true,
    },
];

const mockSecteurs: BlocSector[] = [
    {
        id: 'secteur-1',
        nom: 'Orthopédie',
        couleur: '#FF0000',
        salles: ['salle-1'],
        estActif: true,
    },
    {
        id: 'secteur-2',
        nom: 'Cardiologie',
        couleur: '#0000FF',
        salles: ['salle-2'],
        estActif: true,
    },
];

const mockSupervisors = [
    { id: 'user-1', firstName: 'Jean', lastName: 'Dupont' },
    { id: 'user-2', firstName: 'Marie', lastName: 'Martin' },
];

describe('Workflows du planning du bloc opératoire', () => {
    beforeEach(() => {
        // Configuration des mocks par défaut
        vi.mocked(blocPlanningService.getAllOperatingRooms).mockResolvedValue(mockSalles);
        vi.mocked(blocPlanningService.getAllSectors).mockResolvedValue(mockSecteurs);
        vi.mocked(blocPlanningService.getAllSupervisionRules).mockResolvedValue([]);
        vi.mocked(blocPlanningService.getDayPlanning).mockResolvedValue(null);
        vi.mocked(blocPlanningService.getAvailableSupervisors).mockResolvedValue(mockSupervisors);
        vi.mocked(blocPlanningService.saveDayPlanning).mockImplementation(async (planning) => planning as BlocDayPlanning);
        vi.mocked(blocPlanningService.checkPlanningCompatibility).mockResolvedValue(true);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Workflow de création de planning', () => {
        it('devrait permettre la création d'un nouveau planning avec succès', async () => {
            // Configuration spécifique pour ce test
            const user = userEvent.setup();
        const saveSpy = vi.mocked(blocPlanningService.saveDayPlanning);

        // Rendu du composant de création
        render(<CreateBlocPlanningPage />);

        // Attendre que le chargement soit terminé
        await waitFor(() => {
            expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
        });

        // Vérifier que le formulaire est affiché
        expect(screen.getByText(/Nouveau planning/i)).toBeInTheDocument();

        // Sélectionner une salle dans le menu déroulant
        const selectElement = screen.getByPlaceholderText(/Ajouter une salle/i);
        await user.click(selectElement);

        // Sélectionner la première salle disponible
        const salleOption = await screen.findByText(/Salle 101/i);
        await user.click(salleOption);

        // Vérifier que la salle a été ajoutée
        expect(screen.getByText(/Salle Orthopédie/i)).toBeInTheDocument();

        // Cliquer sur la salle pour l'éditer
        const salleItem = screen.getByText(/Salle Orthopédie/i);
        await user.click(salleItem);

        // Ajouter un superviseur
        const addSupervisorButton = screen.getByRole('button', { name: /Ajouter un superviseur/i });
        await user.click(addSupervisorButton);

        // Sélectionner un médecin
        const selectMedecinElement = screen.getAllByRole('combobox')[1]; // Le deuxième select devrait être celui des médecins
        await user.click(selectMedecinElement);

        // Sélectionner le premier médecin
        const medecinOption = await screen.findByText(/Jean Dupont/i);
        await user.click(medecinOption);

        // Changer le statut du planning
        const statusSelect = screen.getByDisplayValue('Brouillon');
        await user.click(statusSelect);
        const proposeOption = await screen.findByText('Proposé');
        await user.click(proposeOption);

        // Enregistrer le planning
        const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
        await user.click(saveButton);

        // Vérifier que la méthode saveDayPlanning a été appelée
        await waitFor(() => {
            expect(saveSpy).toHaveBeenCalledTimes(1);
            const savedPlanning = saveSpy.mock.calls[0][0];
            expect(savedPlanning.validationStatus).toBe('PROPOSE');
            expect(savedPlanning.salles.length).toBe(1);
            expect(savedPlanning.salles[0].salleId).toBe('salle-1');
            expect(savedPlanning.salles[0].superviseurs.length).toBe(1);
            expect(savedPlanning.salles[0].superviseurs[0].userId).toBe('user-1');
        });

        // Vérifier que le message de succès s'affiche
        expect(await screen.findByText(/Planning créé avec succès/i)).toBeInTheDocument();
    });

    it('devrait permettre la création d'un planning avec plusieurs salles et superviseurs', async () => {
            const user = userEvent.setup();
    const saveSpy = vi.mocked(blocPlanningService.saveDayPlanning);

    render(<CreateBlocPlanningPage />);

    await waitFor(() => {
        expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
    });

    // Ajouter la première salle
    const selectElement1 = screen.getByPlaceholderText(/Ajouter une salle/i);
    await user.click(selectElement1);
    const salleOption1 = await screen.findByText(/Salle 101/i);
    await user.click(salleOption1);

    // Ajouter la deuxième salle
    const selectElement2 = screen.getByPlaceholderText(/Ajouter une salle/i);
    await user.click(selectElement2);
    const salleOption2 = await screen.findByText(/Salle 102/i);
    await user.click(salleOption2);

    // Vérifier que les deux salles ont été ajoutées
    expect(screen.getByText(/Salle Orthopédie/i)).toBeInTheDocument();
    expect(screen.getByText(/Salle Cardiologie/i)).toBeInTheDocument();

    // Configurer la première salle avec un superviseur
    const salleItem1 = screen.getByText(/Salle Orthopédie/i);
    await user.click(salleItem1);

    // Ajouter un superviseur à la première salle
    const addSupervisorButton1 = screen.getByRole('button', { name: /Ajouter un superviseur/i });
    await user.click(addSupervisorButton1);
    const selectMedecinElement1 = screen.getAllByRole('combobox')[1];
    await user.click(selectMedecinElement1);
    const medecinOption1 = await screen.findByText(/Jean Dupont/i);
    await user.click(medecinOption1);

    // Revenir à la liste des salles
    const backButton = screen.getByText(/Retour à la liste des salles/i);
    await user.click(backButton);

    // Configurer la deuxième salle avec un autre superviseur
    const salleItem2 = screen.getByText(/Salle Cardiologie/i);
    await user.click(salleItem2);

    // Ajouter un superviseur à la deuxième salle
    const addSupervisorButton2 = screen.getByRole('button', { name: /Ajouter un superviseur/i });
    await user.click(addSupervisorButton2);
    const selectMedecinElement2 = screen.getAllByRole('combobox')[1];
    await user.click(selectMedecinElement2);
    const medecinOption2 = await screen.findByText(/Marie Martin/i);
    await user.click(medecinOption2);

    // Changer le statut du planning
    const statusSelect = screen.getByDisplayValue('Brouillon');
    await user.click(statusSelect);
    const valideOption = await screen.findByText('Validé');
    await user.click(valideOption);

    // Ajouter des notes générales
    const notesTextarea = screen.getByPlaceholderText(/Notes générales pour le planning/i);
    await user.type(notesTextarea, 'Planning complet avec plusieurs salles');

    // Enregistrer le planning
    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    await user.click(saveButton);

    // Vérifier que la méthode saveDayPlanning a été appelée avec les bonnes données
    await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledTimes(1);
        const savedPlanning = saveSpy.mock.calls[0][0];
        expect(savedPlanning.validationStatus).toBe('VALIDE');
        expect(savedPlanning.notes).toBe('Planning complet avec plusieurs salles');
        expect(savedPlanning.salles.length).toBe(2);

        // Vérifier les salles et superviseurs
        const salle1 = savedPlanning.salles.find(s => s.salleId === 'salle-1');
        const salle2 = savedPlanning.salles.find(s => s.salleId === 'salle-2');

        expect(salle1).toBeDefined();
        expect(salle2).toBeDefined();
        expect(salle1?.superviseurs.length).toBe(1);
        expect(salle2?.superviseurs.length).toBe(1);
        expect(salle1?.superviseurs[0].userId).toBe('user-1');
        expect(salle2?.superviseurs[0].userId).toBe('user-2');
    });
});
    });

describe('Workflow d'édition de planning', () => {
        it('devrait permettre la modification d'un planning existant', async () => {
            // Préparer un planning existant
            const existingPlanning: BlocDayPlanning = {
    id: 'planning-1',
    date: format(new Date(), 'yyyy-MM-dd'),
    salles: [
        {
            id: 'assignment-1',
            salleId: 'salle-1',
            superviseurs: [],
            notes: 'Notes initiales'
        }
    ],
    validationStatus: 'BROUILLON'
};

// Configurer le mock pour retourner le planning existant
vi.mocked(blocPlanningService.getDayPlanning).mockResolvedValue(existingPlanning);
const saveSpy = vi.mocked(blocPlanningService.saveDayPlanning);
const user = userEvent.setup();

// Rendu du composant d'édition
render(<EditBlocPlanningPage />);

// Attendre que le chargement soit terminé
await waitFor(() => {
    expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
});

// Vérifier que le planning existant est chargé
expect(screen.getByText(/Salle Orthopédie/i)).toBeInTheDocument();

// Cliquer sur la salle pour l'éditer
const salleItem = screen.getByText(/Salle Orthopédie/i);
await user.click(salleItem);

// Modifier les notes de la salle
const notesTextarea = screen.getByPlaceholderText(/Notes spécifiques à cette salle/i);
await user.clear(notesTextarea);
await user.type(notesTextarea, 'Nouvelles notes pour la salle');

// Ajouter un superviseur
const addSupervisorButton = screen.getByRole('button', { name: /Ajouter un superviseur/i });
await user.click(addSupervisorButton);

// Changer le statut du planning en validé
const statusSelect = screen.getByDisplayValue('Brouillon');
await user.click(statusSelect);
const valideOption = await screen.findByText('Validé');
await user.click(valideOption);

// Enregistrer les modifications
const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
await user.click(saveButton);

// Vérifier que la méthode saveDayPlanning a été appelée avec les bonnes données
await waitFor(() => {
    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedPlanning = saveSpy.mock.calls[0][0];
    expect(savedPlanning.id).toBe('planning-1');
    expect(savedPlanning.validationStatus).toBe('VALIDE');
    expect(savedPlanning.salles[0].notes).toBe('Nouvelles notes pour la salle');
    expect(savedPlanning.salles[0].superviseurs.length).toBe(1);
});

// Vérifier que le message de succès s'affiche
expect(await screen.findByText(/Planning enregistré avec succès/i)).toBeInTheDocument();
        });

it('devrait permettre de supprimer un superviseur d'une salle', async () => {
            // Préparer un planning existant avec un superviseur
            const existingPlanning: BlocDayPlanning = {
    id: 'planning-1',
    date: format(new Date(), 'yyyy-MM-dd'),
    salles: [
        {
            id: 'assignment-1',
            salleId: 'salle-1',
            superviseurs: [
                {
                    id: 'supervisor-1',
                    userId: 'user-1',
                    role: 'PRINCIPAL',
                    periodes: [{ debut: '08:00', fin: '12:00' }]
                }
            ],
            notes: ''
        }
    ],
    validationStatus: 'BROUILLON'
};

vi.mocked(blocPlanningService.getDayPlanning).mockResolvedValue(existingPlanning);
const saveSpy = vi.mocked(blocPlanningService.saveDayPlanning);
const user = userEvent.setup();

render(<EditBlocPlanningPage />);

await waitFor(() => {
    expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
});

// Cliquer sur la salle pour l'éditer
const salleItem = screen.getByText(/Salle Orthopédie/i);
await user.click(salleItem);

// Vérifier que le superviseur est affiché
expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();

// Supprimer le superviseur
const deleteButton = screen.getByRole('button', { name: /Supprimer ce superviseur/i });
await user.click(deleteButton);

// Enregistrer les modifications
const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
await user.click(saveButton);

// Vérifier que le superviseur a été supprimé
await waitFor(() => {
    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedPlanning = saveSpy.mock.calls[0][0];
    expect(savedPlanning.salles[0].superviseurs.length).toBe(0);
});
        });

it('devrait permettre de changer le statut d'un planning de VALIDE à PUBLIE', async () => {
            // Planning déjà validé
            const validatedPlanning: BlocDayPlanning = {
    id: 'planning-1',
    date: format(new Date(), 'yyyy-MM-dd'),
    salles: [
        {
            id: 'assignment-1',
            salleId: 'salle-1',
            superviseurs: [
                {
                    id: 'supervisor-1',
                    userId: 'user-1',
                    role: 'PRINCIPAL',
                    periodes: [{ debut: '08:00', fin: '12:00' }]
                }
            ]
        }
    ],
    validationStatus: 'VALIDE'
};

vi.mocked(blocPlanningService.getDayPlanning).mockResolvedValue(validatedPlanning);
const saveSpy = vi.mocked(blocPlanningService.saveDayPlanning);
const user = userEvent.setup();

render(<EditBlocPlanningPage />);

await waitFor(() => {
    expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
});

// Vérifier que le statut actuel est VALIDE
expect(screen.getByDisplayValue('Validé')).toBeInTheDocument();

// Changer le statut à PUBLIE
const statusSelect = screen.getByDisplayValue('Validé');
await user.click(statusSelect);
const publishOption = await screen.findByText('Publié');
await user.click(publishOption);

// Enregistrer les modifications
const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
await user.click(saveButton);

// Vérifier que le planning a été mis à jour avec le nouveau statut
await waitFor(() => {
    expect(saveSpy).toHaveBeenCalledTimes(1);
    const savedPlanning = saveSpy.mock.calls[0][0];
    expect(savedPlanning.validationStatus).toBe('PUBLIE');
});

// Vérifier que le message de succès s'affiche
expect(await screen.findByText(/Planning enregistré avec succès/i)).toBeInTheDocument();
        });
    });

describe('Tests limites et gestion d'erreurs', () => {
        it('devrait afficher une erreur si la sauvegarde échoue', async () => {
    // Simuler une erreur lors de la sauvegarde
    const errorMessage = 'Erreur de serveur lors de la sauvegarde';
    vi.mocked(blocPlanningService.saveDayPlanning).mockRejectedValue(new Error(errorMessage));

    const user = userEvent.setup();

    // Rendu du composant de création
    render(<CreateBlocPlanningPage />);

    // Attendre que le chargement soit terminé
    await waitFor(() => {
        expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
    });

    // Sélectionner une salle et rapidement tenter d'enregistrer
    const selectElement = screen.getByPlaceholderText(/Ajouter une salle/i);
    await user.click(selectElement);
    const salleOption = await screen.findByText(/Salle 101/i);
    await user.click(salleOption);

    // Enregistrer le planning
    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    await user.click(saveButton);

    // Vérifier que le message d'erreur s'affiche
    expect(await screen.findByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
});

it('devrait afficher un avertissement pour validation avec conflit', async () => {
    // Simuler une validation avec conflit
    const validationResult = {
        isValid: false,
        errors: [
            {
                id: 'conflict-1',
                type: 'REGLE_SUPERVISION',
                description: 'Le superviseur est assigné à trop de salles',
                severite: 'ERREUR',
                entitesAffectees: [{ type: 'SUPERVISEUR', id: 'user-1' }],
                estResolu: false,
            }
        ],
        warnings: [],
        infos: []
    };

    vi.mocked(blocPlanningService.validateDayPlanning).mockResolvedValue(validationResult);
    const user = userEvent.setup();

    render(<CreateBlocPlanningPage />);

    await waitFor(() => {
        expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
    });

    // Ajouter une salle
    const selectElement = screen.getByPlaceholderText(/Ajouter une salle/i);
    await user.click(selectElement);
    const salleOption = await screen.findByText(/Salle 101/i);
    await user.click(salleOption);

    // Cliquer sur le bouton de validation
    const validateButton = screen.getByText(/Valider le planning/i);
    await user.click(validateButton);

    // Vérifier que le message d'erreur de validation s'affiche
    expect(await screen.findByText(/Le superviseur est assigné à trop de salles/i)).toBeInTheDocument();
    expect(await screen.findByText(/Le planning contient des erreurs/i)).toBeInTheDocument();
});

it('devrait permettre de supprimer un planning existant', async () => {
    // Préparer un planning existant
    const existingPlanning: BlocDayPlanning = {
        id: 'planning-1',
        date: format(new Date(), 'yyyy-MM-dd'),
        salles: [
            {
                id: 'assignment-1',
                salleId: 'salle-1',
                superviseurs: [],
            }
        ],
        validationStatus: 'BROUILLON'
    };

    vi.mocked(blocPlanningService.getDayPlanning).mockResolvedValue(existingPlanning);
    const deleteSpy = vi.mocked(blocPlanningService.deleteDayPlanning).mockResolvedValue(true);
    const user = userEvent.setup();

    render(<EditBlocPlanningPage />);

    await waitFor(() => {
        expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
    });

    // Trouver et cliquer sur le bouton de suppression
    const deleteButton = screen.getByRole('button', { name: /Supprimer ce planning/i });
    await user.click(deleteButton);

    // Confirmer la suppression dans la boîte de dialogue
    const confirmButton = screen.getByRole('button', { name: /Confirmer/i });
    await user.click(confirmButton);

    // Vérifier que la méthode deleteDayPlanning a été appelée
    await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledTimes(1);
        expect(deleteSpy).toHaveBeenCalledWith(existingPlanning.date);
    });

    // Vérifier que le message de succès s'affiche
    expect(await screen.findByText(/Planning supprimé avec succès/i)).toBeInTheDocument();
});
    });
}); 