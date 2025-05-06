import { jest as vi, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BlocDayPlanning, OperatingRoom, BlocSector } from '@/types/bloc-planning-types';
import { blocPlanningService } from '@/services/blocPlanningService';
import BlocPlanning from '@/app/bloc-operatoire/components/BlocPlanning';
import BlocPlanningDay from '@/app/bloc-operatoire/components/BlocPlanningDay';

// Mock des dépendances
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

vi.mock('@/services/blocPlanningService', () => ({
    blocPlanningService: {
        getAllOperatingRooms: vi.fn(),
        getAllSectors: vi.fn(),
        getDayPlanning: vi.fn(),
    },
}));

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

describe("Tests d'intégration de la structure et navigation du bloc opératoire", () => {
    let today: Date;
    let formattedToday: string;

    beforeEach(() => {
        today = new Date();
        formattedToday = format(today, 'yyyy-MM-dd');

        // Mock par défaut pour les calls au service
        vi.mocked(blocPlanningService.getAllOperatingRooms).mockResolvedValue(mockSalles);
        vi.mocked(blocPlanningService.getAllSectors).mockResolvedValue(mockSecteurs);
        vi.mocked(blocPlanningService.getDayPlanning).mockResolvedValue(null);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('BlocPlanning - Vue calendrier', () => {
        it('devrait afficher une vue calendrier d\'une semaine par défaut', async () => {
            render(<BlocPlanning />);

            await waitFor(() => {
                expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
            });

            // Vérifier que la semaine en cours est affichée
            const firstDayOfWeek = startOfWeek(today, { locale: fr });
            const lastDayOfWeek = endOfWeek(today, { locale: fr });

            const daysOfWeek = eachDayOfInterval({
                start: firstDayOfWeek,
                end: lastDayOfWeek
            });

            // Vérifier que chaque jour de la semaine est affiché
            for (const day of daysOfWeek) {
                const dayText = format(day, 'EEEE d', { locale: fr });
                expect(screen.getByText(new RegExp(dayText, 'i'))).toBeInTheDocument();
            }

            // Vérifier que les contrôles de navigation sont présents
            expect(screen.getByRole('button', { name: /Semaine précédente/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Semaine suivante/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Aujourd'hui/i })).toBeInTheDocument();
        });

        it('devrait permettre de naviguer entre les semaines', async () => {
            const user = userEvent.setup();
            const router = vi.fn();

            render(<BlocPlanning />);

            await waitFor(() => {
                expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
            });

            // Naviguer vers la semaine suivante
            const nextWeekButton = screen.getByRole('button', { name: /Semaine suivante/i });
            await user.click(nextWeekButton);

            // Vérifier que le service a été appelé avec les nouvelles dates
            await waitFor(() => {
                expect(blocPlanningService.getDayPlanning).toHaveBeenCalledWith(
                    format(addDays(today, 7), 'yyyy-MM-dd')
                );
            });

            // Naviguer vers la semaine précédente
            const prevWeekButton = screen.getByRole('button', { name: /Semaine précédente/i });
            await user.click(prevWeekButton);

            // Vérifier que le service a été appelé avec les dates d'origine
            await waitFor(() => {
                expect(blocPlanningService.getDayPlanning).toHaveBeenCalledWith(formattedToday);
            });

            // Revenir à aujourd'hui
            const todayButton = screen.getByRole('button', { name: /Aujourd'hui/i });
            await user.click(todayButton);

            // Vérifier que le service a été appelé avec la date d'aujourd'hui
            await waitFor(() => {
                expect(blocPlanningService.getDayPlanning).toHaveBeenCalledWith(formattedToday);
            });
        });

        it('devrait afficher correctement les plannings existants', async () => {
            // Créer un mock de planning pour aujourd'hui
            const planning: BlocDayPlanning = {
                id: 'planning-1',
                date: formattedToday,
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

            // Configurer le mock pour retourner ce planning
            vi.mocked(blocPlanningService.getDayPlanning).mockResolvedValue(planning);

            render(<BlocPlanning />);

            await waitFor(() => {
                expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
            });

            // Vérifier que le jour avec planning a un style différent ou un indicateur
            const todayCell = screen.getByText(new RegExp(format(today, 'EEEE d', { locale: fr }), 'i')).closest('div');
            expect(todayCell).toHaveAttribute('data-has-planning', 'true');

            // Vérifier que le statut du planning est affiché
            expect(screen.getByText(/Validé/i)).toBeInTheDocument();

            // Vérifier qu'il y a une indication du nombre de salles
            expect(screen.getByText(/1 salle/i)).toBeInTheDocument();
        });
    });

    describe('BlocPlanningDay - Vue journalière', () => {
        it('devrait afficher un message lorsqu\'aucun planning n\'existe pour un jour', async () => {
            // Mock renvoyant null pour indiquer qu'aucun planning n'existe
            vi.mocked(blocPlanningService.getDayPlanning).mockResolvedValue(null);

            render(
                <BlocPlanningDay
                    date={ today }
                    planning = { null}
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    getSecteurForSalle = {(salleId) => mockSecteurs.find(s => s.salles.includes(salleId))}
                />
        );

        // Vérifier que le message "aucun planning" est affiché
        expect(screen.getByText(/Aucun planning défini pour cette journée/i)).toBeInTheDocument();

        // Vérifier que le bouton de création est présent
        expect(screen.getByRole('button', { name: /Créer planning/i })).toBeInTheDocument();
    });

    it('devrait afficher correctement un planning existant', async () => {
        // Créer un planning de test
        const planning: BlocDayPlanning = {
            id: 'planning-1',
            date: formattedToday,
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
                },
                {
                    id: 'assignment-2',
                    salleId: 'salle-2',
                    superviseurs: []
                }
            ],
            validationStatus: 'BROUILLON',
            notes: 'Notes de test'
        };

        render(
            <BlocPlanningDay
                    date={ today }
                    planning = { planning }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    getSecteurForSalle = {(salleId) => mockSecteurs.find(s => s.salles.includes(salleId))}
                />
    );

    // Vérifier que le statut est affiché
    expect(screen.getByText(/Brouillon/i)).toBeInTheDocument();

    // Vérifier que le bouton d'édition est présent
    expect(screen.getByRole('button', { name: /Modifier/i })).toBeInTheDocument();

    // Vérifier que les salles sont affichées
    expect(screen.getByText(/Salle Orthopédie/i)).toBeInTheDocument();
    expect(screen.getByText(/Salle Cardiologie/i)).toBeInTheDocument();

    // Vérifier que les couleurs des secteurs sont appliquées
    const orthopedieElement = screen.getByTestId('salle-indicator-salle-1');
    expect(orthopedieElement).toHaveStyle('border-color: #FF0000');

    const cardiologieElement = screen.getByTestId('salle-indicator-salle-2');
    expect(cardiologieElement).toHaveStyle('border-color: #0000FF');
});

it('devrait permettre la navigation vers l\'écran d\'édition', async () => {
    const user = userEvent.setup();
    const mockRouter = { push: vi.fn() };
    vi.mock('next/navigation', () => ({
        useRouter: () => mockRouter
    }));

    // Créer un planning de test
    const planning: BlocDayPlanning = {
        id: 'planning-1',
        date: formattedToday,
        salles: [],
        validationStatus: 'BROUILLON'
    };

    render(
        <BlocPlanningDay
                    date={ today }
                    planning = { planning }
                    salles = { mockSalles }
                    secteurs = { mockSecteurs }
                    getSecteurForSalle = {(salleId) => mockSecteurs.find(s => s.salles.includes(salleId))}
                />
);

// Cliquer sur le bouton d'édition
const editButton = screen.getByRole('button', { name: /Modifier/i });
await user.click(editButton);

// Vérifier que la navigation a été effectuée
expect(mockRouter.push).toHaveBeenCalledWith(`/bloc-operatoire/edit/${formattedToday}`);
        });

it('devrait afficher différemment les statuts de validation du planning', async () => {
    // Tester chaque statut
    const statuts: Array<'BROUILLON' | 'PROPOSE' | 'VALIDE' | 'PUBLIE'> = [
        'BROUILLON', 'PROPOSE', 'VALIDE', 'PUBLIE'
    ];

    for (const statut of statuts) {
        // Créer un planning avec le statut à tester
        const planning: BlocDayPlanning = {
            id: `planning-${statut}`,
            date: formattedToday,
            salles: [],
            validationStatus: statut
        };

        const { unmount } = render(
            <BlocPlanningDay
                        date={ today }
                        planning = { planning }
                        salles = { mockSalles }
                        secteurs = { mockSecteurs }
                        getSecteurForSalle = {(salleId) => mockSecteurs.find(s => s.salles.includes(salleId))
    }
                    />
                );

// Vérifier que le statut est affiché correctement
const statusBadge = screen.getByText(new RegExp(statut.charAt(0) + statut.slice(1).toLowerCase(), 'i'));
expect(statusBadge).toBeInTheDocument();

// Vérifier que le badge a le style approprié
if (statut === 'PUBLIE') {
    expect(statusBadge.closest('span')).toHaveAttribute('data-status', 'published');
} else {
    expect(statusBadge.closest('span')).toHaveAttribute('data-status', 'draft');
}

// Nettoyer après chaque test
unmount();
            }
        });
    });
});