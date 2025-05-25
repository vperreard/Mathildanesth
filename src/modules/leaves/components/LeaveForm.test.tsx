/// <reference path="../../../types/jest-dom.d.ts" />

// global.fetch = jest.fn(); // Déplacer cette logique dans beforeEach

import React from 'react';
import { render, screen, fireEvent, waitFor, act, within, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { LeaveForm, LeaveFormProps } from './LeaveForm';
import { useLeaveCalculation } from '../hooks/useLeaveCalculation';
import { PublicHolidayDetail, LeaveCalculationOptions, LeaveCalculationDetails } from '../types/leave';
import { useRouter } from 'next/router';
import { User, UserRole } from '@/types/user';
import { WorkSchedule, WeekType, WorkFrequency } from '@/modules/profiles/types/workSchedule';
import {
    expectToBeInDocument,
    expectToBeChecked,
    expectToHaveBeenCalled,
    expectToHaveBeenCalledWith,
    expectToHaveValue,
    expectToHaveTextContent,
    objectContaining,
    anyValue,
    expectNotToHaveProperty,
    expectToBeUndefined,
    expectNotToHaveBeenCalled
} from '@/tests/utils/assertions';
import { fr } from 'date-fns/locale';
import apiClientActualImport from '@/utils/apiClient';
import { SessionProvider } from 'next-auth/react';
// import { SWRConfig } from 'swr'; // Supprimé car non utilisé et cause une erreur
// LeaveTypeSetting et z ne sont plus nécessaires ici si on ne recrée pas le schéma localement
// import { LeaveTypeSetting } from '@prisma/client';
// import { z } from 'zod';

jest.mock('axios', () => {
    // Créer les fonctions mockées pour une instance d'axios à l'intérieur de la factory
    const mockAxiosInstanceInternal = {
        interceptors: {
            request: { use: jest.fn(), eject: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    };

    return {
        __esModule: true,
        default: {
            // create retourne maintenant la nouvelle instance mockée définie ci-dessus
            create: jest.fn(() => mockAxiosInstanceInternal),
            // Les méthodes statiques d'axios (si utilisées directement comme axios.get())
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            patch: jest.fn(),
            isAxiosError: jest.fn((payload: any): payload is import('axios').AxiosError => {
                return typeof payload === 'object' && payload !== null && 'isAxiosError' in payload;
            }),
        },
        isAxiosError: jest.fn((payload: any): payload is import('axios').AxiosError => {
            return typeof payload === 'object' && payload !== null && 'isAxiosError' in payload;
        }),
    };
});

// Le mock pour @/utils/apiClient n'est plus nécessaire, car apiClient sera
// automatiquement l'instance retournée par le axios.create mocké.

jest.mock('react-hot-toast');
jest.mock('../hooks/useLeaveCalculation');
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));
jest.mock('@/lib/dateUtils', () => ({
    ...jest.requireActual('@/lib/dateUtils'),
    areDatesSameDay: jest.fn((date1, date2) => {
        if (!date1 || !date2) return false;
        return date1.toDateString() === date2.toDateString();
    }),
    getStartOfDay: jest.fn(date => date ? new Date(date.setHours(0, 0, 0, 0)) : null),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedToast = toast as jest.Mocked<typeof toast>;
const mockUseLeaveCalculation = useLeaveCalculation as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

// const mockLogger = { ... }; // Plus besoin de déclarer mockLogger ici

jest.mock('@/utils/logger', () => ({
    // Définir les fonctions mockées du logger directement dans la factory
    getLogger: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    })),
}));

// Réponse brute simulée de l'API /api/admin/leave-type-settings?selectable=true
// Cette structure doit correspondre à ce que l'API retourne réellement.
// Le composant s'attend à des objets avec au moins id, code, label (ou name que le composant essaiera d'utiliser pour label).
const mockAPIRawTypesResponse = [
    { id: 'uuid1', code: 'ANNUAL', label: 'Congé Annuel API (Raw)', description: 'Congés annuels bruts', name: 'Congé Annuel API Name' },
    { id: 'uuid2', code: 'RTT', label: 'RTT API (Raw)', description: 'RTT bruts', name: 'RTT API Name' },
    { id: 'uuid3', code: 'SICK', label: 'Maladie API (Raw)', description: 'Congé maladie brut', name: 'Maladie API Name' },
];

const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    nom: 'User',
    prenom: 'Test',
    role: UserRole.UTILISATEUR,
    profilePictureUrl: ''
};

const mockWorkSchedule: WorkSchedule = { // Ce mock n'est pas utilisé directement par LeaveForm mais peut l'être par des hooks indirects
    id: 'ws1',
    userId: 1,
    weekType: WeekType.BOTH,
    frequency: WorkFrequency.FULL_TIME,
    createdAt: new Date(),
    updatedAt: new Date(),
    workingTimePercentage: 100,
    workingDays: [1, 2, 3, 4, 5],
    annualLeaveAllowance: 25,
    isActive: true,
    validFrom: new Date('2023-01-01'),
};

const defaultMockUseLeaveCalculationResult = {
    details: null as LeaveCalculationDetails | null,
    isLoading: false,
    error: null as Error | null,
    status: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    recalculate: jest.fn(),
    publicHolidays: [] as PublicHolidayDetail[],
    workingDays: 0,
    countedDays: 0,
    hasValidDates: false,
};

// Le schéma Zod est interne à LeaveForm.tsx et n'a pas besoin d'être dupliqué ici
// pour les tests fonctionnels du composant, sauf si on teste la validation en isolation.

// mockCreateLeave et mockUpdateLeave ne sont plus nécessaires
// const mockCreateLeave = require('@/services/api/leaves').createLeave as jest.Mock;
// const mockUpdateLeave = require('@/services/api/leaves').updateLeave as jest.Mock;

// mockLeaveTypes n'est plus nécessaire car on mocke la réponse fetch brute
// const mockLeaveTypes: LeaveTypeSetting[] = [ ... ];

// defaultProps est incorrect car LeaveFormProps a seulement userId et onSuccess
// const defaultProps: LeaveFormProps = { ... };


describe('LeaveForm', () => {
    let mockOnSuccess: jest.Mock;
    // Garder une référence au fetch original si besoin de le restaurer, bien que jest.clearAllMocks/resetAllMocks devrait s'en charger.
    // const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks(); // Important pour isoler les tests
        mockOnSuccess = jest.fn();

        // Réassigner global.fetch à un nouveau mock Jest ICI, dans beforeEach
        global.fetch = jest.fn();

        mockUseLeaveCalculation.mockReturnValue(defaultMockUseLeaveCalculationResult);
        mockUseRouter.mockReturnValue({ push: jest.fn() });

        // Mock fetch plus explicite avec vraie simulation asynchrone
        (global.fetch as jest.Mock).mockImplementation(async (url: string | Request | URL) => {
            if (url === '/api/leaves/types') {
                // Simuler un vrai délai réseau court
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            ok: true,
                            status: 200,
                            json: async () => {
                                return Promise.resolve(mockAPIRawTypesResponse);
                            },
                        });
                    }, 10); // 10ms de délai pour simuler le réseau
                });
            }
            // Gérer d'autres appels fetch si nécessaire, ou rejeter
            return Promise.reject(new Error(`Unhandled fetch call to ${url}`));
        });
        mockedAxios.post.mockReset(); // Si mockedAxios est utilisé, il faut aussi le reset.
    });

    // afterEach(() => {
    // global.fetch = originalFetch; // Restaurer fetch si nécessaire, mais resetAllMocks est mieux.
    // });

    // `LeaveFormProps` attend `userId: number`. Notre `mockUser.id` est string.
    // Il faut soit changer `LeaveFormProps.userId` en `string`, soit `User.id` en `number`.
    // Pour l'instant, on caste.
    const renderTheForm = (props?: Partial<LeaveFormProps>) => {
        const defaultTestProps: LeaveFormProps = {
            userId: 1,
            onSuccess: mockOnSuccess,
        };
        return render(<LeaveForm {...defaultTestProps} {...props} />);
    }


    it('should render initial form elements correctly', async () => {
        let rendered;

        // Wrapper dans act pour s'assurer que tous les effets se déclenchent
        await act(async () => {
            rendered = renderTheForm();
        });

        expectToBeInDocument(screen.getByText('Nouvelle demande de congé'));
        expectToBeInDocument(screen.getByLabelText('Type de congé'));
        expectToBeInDocument(screen.getByLabelText('Date de début'));
        expectToBeInDocument(screen.getByLabelText('Date de fin'));
        expectToBeInDocument(screen.getByLabelText('Demi-journée'));
        expectToBeInDocument(screen.getByText('Soumettre la demande'));

        // Attendre que le fetch se termine et que le composant se mette à jour
        await act(async () => {
            // Flush toutes les promesses en attente
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Attendre que le select ne soit plus disabled
        await waitFor(() => {
            const selectElement = screen.getByLabelText('Type de congé') as HTMLSelectElement;
            expect(selectElement).not.toBeDisabled();
        }, { timeout: 5000 });

        // Vérifier que les options sont bien chargées avec les traductions
        await waitFor(() => {
            expectToBeInDocument(screen.getByDisplayValue('Congé annuel'));
        }, { timeout: 1000 });
    });

    it('should display loading state for leave types', () => {
        (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => { }));
        renderTheForm();
        expectToBeInDocument(screen.getByDisplayValue('Chargement...'));
    });

    it('should handle error when loading leave types', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch types'));
        renderTheForm();
        await waitFor(() => {
            expectToBeInDocument(screen.getByDisplayValue('Erreur de chargement'));
        });
    });

    it('should call useLeaveCalculation with initial dates and options', () => {
        renderTheForm();
        expectToHaveBeenCalledWith(mockUseLeaveCalculation, {
            startDate: null,
            endDate: null,
            options: { countHalfDays: false, halfDayPeriod: undefined },
        });
    });

    it('should update useLeaveCalculation when dates change', async () => {
        renderTheForm();
        const user = userEvent.setup();

        // Appel initial vérifié par le test précédent 'should call useLeaveCalculation with initial dates and options'
        // On peut le revérifier pour s'assurer de l'état de départ si besoin.
        expectToHaveBeenCalledWith(mockUseLeaveCalculation, {
            startDate: null,
            endDate: null,
            options: { countHalfDays: false, halfDayPeriod: undefined },
        });

        const startDateInput = screen.getByLabelText('Date de début');
        const endDateInput = screen.getByLabelText('Date de fin');

        // Simuler la saisie de dates
        // userEvent.type est généralement pour ajouter du texte.
        // Pour les champs de date, il est souvent préférable de simuler un changement de valeur direct
        // ou d'utiliser fireEvent.change si l'input réagit bien à cela.
        // Avec react-datepicker, l'input est souvent contrôlé et userEvent.type peut être délicat.
        // On va essayer avec fireEvent.change, qui est plus bas niveau.

        // Pour que le DatePicker réagisse, il faut que le format corresponde à ce qu'il attend, ou que l'utilisateur tape réellement.
        // Le composant utilise dd/MM/yyyy.
        // On simule la sélection d'une date via le DatePicker en mettant à jour son état interne (via props)
        // ce qui est déjà fait par la fonction helper simulateDateSelection, 
        // mais ici on veut tester l'interaction.

        // Effacer le champ avant de taper pour éviter les problèmes de concaténation si l'input a une valeur par défaut.
        await user.clear(startDateInput);
        await user.type(startDateInput, '02/09/2024'); // react-datepicker devrait parser ça
        // Attendre que le DatePicker interne traite la modification et appelle son onChange, 
        // qui met à jour l'état startDate dans LeaveForm.
        // Cela devrait ensuite déclencher un nouvel appel à useLeaveCalculation.

        // La vérification de l'appel au hook se fait sur base de l'état du composant LeaveForm.
        // Donc, il faut attendre que l'état du formulaire (startDate, endDate) soit mis à jour.
        // Puisque useLeaveCalculation est appelé dans un useEffect dépendant de startDate/endDate,
        // on peut attendre que le mock soit appelé avec les nouvelles valeurs.

        // La date sera parsée par DatePicker puis passée au onChange de LeaveForm.
        // Le format interne dans LeaveForm sera un objet Date.
        // Mock de getStartOfDay utilisé par le composant :
        // getStartOfDay: jest.fn(date => date ? new Date(date.setHours(0, 0, 0, 0)) : null),
        // Pour "02/09/2024", cela deviendra new Date(2024, 8, 2) (mois 0-indexé).

        // Après la première date:
        // Il est difficile de prédire l'état exact ici sans connaître le comportement exact de react-datepicker
        // et la propagation des changements. On va plutôt vérifier l'appel final.

        await user.clear(endDateInput);
        await user.type(endDateInput, '03/09/2024');

        // Attendre que les deux changements de date aient propagé et que useLeaveCalculation soit appelé avec les nouvelles dates.
        // On s'attend à ce que le hook soit appelé plusieurs fois: initial, après startDate, après endDate.
        // On vérifie le dernier appel pertinent.
        await waitFor(() => {
            expectToHaveBeenCalledWith(mockUseLeaveCalculation, expect.objectContaining({
                // Les dates doivent être des objets Date, au début du jour.
                startDate: new Date(2024, 8, 2), // Septembre est le mois 8
                endDate: new Date(2024, 8, 3),
                options: { countHalfDays: false, halfDayPeriod: undefined },
            }));
        });
    });

    it('should handle half-day selection', async () => {
        renderTheForm();
        const user = userEvent.setup();
        const halfDayCheckbox = screen.getByLabelText('Demi-journée');

        await user.click(halfDayCheckbox);
        expectToBeChecked(halfDayCheckbox);
        expectToBeInDocument(screen.getByLabelText('Matin'));
        expectToBeInDocument(screen.getByLabelText('Après-midi'));

        // Utilisation des fonctions d'utilitaire objectContaining
        const expectOptions = { countHalfDays: true, halfDayPeriod: 'AM' };
        expectToHaveBeenCalledWith(mockUseLeaveCalculation, objectContaining({
            options: objectContaining(expectOptions)
        }));

        const pmRadio = screen.getByLabelText('Après-midi');
        await user.click(pmRadio);

        const expectOptionsPM = { countHalfDays: true, halfDayPeriod: 'PM' };
        expectToHaveBeenCalledWith(mockUseLeaveCalculation, objectContaining({
            options: objectContaining(expectOptionsPM)
        }));
    });

    it('should display calculated days when hook returns success', async () => {
        mockUseLeaveCalculation.mockReturnValue({
            ...defaultMockUseLeaveCalculationResult,
            status: 'success',
            countedDays: 3,
            workingDays: 3,
            hasValidDates: true,
        });
        renderTheForm();
        await waitFor(() => {
            expectToBeInDocument(screen.getByText(/Jours décomptés : 3/));
        });
    });

    it('should display loading calculation state', () => {
        mockUseLeaveCalculation.mockReturnValue({
            ...defaultMockUseLeaveCalculationResult,
            isLoading: true,
            status: 'loading',
            hasValidDates: true,
        });
        renderTheForm();
        expectToBeInDocument(screen.getByText(/Calcul des jours en cours.../));
    });

    it('should display calculation error state', () => {
        mockUseLeaveCalculation.mockReturnValue({
            ...defaultMockUseLeaveCalculationResult,
            status: 'error',
            error: new Error('Custom calculation error'),
            hasValidDates: true,
        });
        renderTheForm();
        expectToBeInDocument(screen.getByText(/Erreur calcul: Custom calculation error/));
    });

    it('should validate form on submit and show errors if invalid', async () => {
        renderTheForm();
        const user = userEvent.setup();
        const submitButton = screen.getByText('Soumettre la demande');

        await user.click(submitButton); // Soumission sans dates

        expectToBeInDocument(await screen.findByText('La date de début est requise.'));
        expectToBeInDocument(screen.getByText('La date de fin est requise.'));
        expectNotToHaveBeenCalled(mockedAxios.post);
    });

    const fillDatesInForm = async (user: ReturnType<typeof userEvent.setup>, startDateStr: string, endDateStr: string) => {
        const startDateInput = screen.getByLabelText('Date de début');
        const endDateInput = screen.getByLabelText('Date de fin');

        // Utiliser userEvent.type qui est plus proche de l'interaction utilisateur réelle
        await user.clear(startDateInput); // Clear au cas où il y aurait une valeur précédente
        await user.type(startDateInput, startDateStr);
        fireEvent.blur(startDateInput); // Déclencher blur pour que react-datepicker/react-hook-form traitent la valeur

        await user.clear(endDateInput);
        await user.type(endDateInput, endDateStr);
        fireEvent.blur(endDateInput); // Déclencher blur

        // Attendre un court instant pour que les états se propagent.
        // Ceci est un peu une "rustine", l'idéal serait d'attendre un effet visible.
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50)); // Petit délai
        });
    };


    describe('Form Submission', () => {
        const validStartDate = new Date(2024, 8, 2);
        const validEndDate = new Date(2024, 8, 3);

        const simulateDateSelection = (startDate: Date | null, endDate: Date | null, status: 'success' | 'loading' | 'idle' | 'error' = 'idle') => {
            let currentStatus = status;
            if (startDate && endDate && startDate <= endDate && status === 'idle') {
                currentStatus = 'success';
            }

            mockUseLeaveCalculation.mockReturnValue({
                ...defaultMockUseLeaveCalculationResult,
                startDate: startDate,
                endDate: endDate,
                status: currentStatus,
                countedDays: (currentStatus === 'success') ? 2 : 0,
                workingDays: (currentStatus === 'success') ? 2 : 0,
                hasValidDates: !!(startDate && endDate && startDate <= endDate),
                calculationMessage: currentStatus === 'loading' ? 'Calcul des jours en cours...' : null,
            });
        };

        beforeEach(() => {
            // Par défaut, pour les tests de soumission, on simule que le calcul est réussi après sélection des dates.
            // Le composant lui-même va passer par 'loading' etc.
            simulateDateSelection(validStartDate, validEndDate, 'success');
        });

        it('should submit valid data to /api/leaves/batch and handle success', async () => {
            // S'assurer que le hook retournera 'success' une fois les dates valides settées.
            // Le simulateDateSelection dans beforeEach fait déjà cela.

            let rendered;
            await act(async () => {
                rendered = renderTheForm();
            });

            // Attendre que le fetch se termine
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const user = userEvent.setup();

            const leaveTypeSelectField = screen.getByLabelText('Type de congé');
            await waitFor(() => { expect(leaveTypeSelectField).not.toBeDisabled(); }, { timeout: 5000 });
            await user.selectOptions(leaveTypeSelectField, 'ANNUAL');

            await fillDatesInForm(user, '02/09/2024', '03/09/2024');
            // À ce stade, on s'attend à ce que react-hook-form ait les dates,
            // et useLeaveCalculation ait été appelé avec ces dates et ait mis à jour son état (mocké en 'success').
            // Le composant devrait afficher "Jours décomptés : 2"
            await screen.findByText(/Jours décomptés : 2/i, {}, { timeout: 3000 });

            await user.type(screen.getByLabelText(/Motif/), 'Vacances annuelles');

            const mockCreatedLeave = { id: 'leave123', userId: mockUser.id, startDate: validStartDate.toISOString(), typeCode: 'ANNUAL' };
            mockedAxios.post.mockResolvedValue({
                data: {
                    results: [{
                        input: { userId: parseInt(mockUser.id, 10), startDate: '2024-09-02', endDate: '2024-09-03', typeCode: 'ANNUAL', reason: 'Vacances annuelles' },
                        success: true,
                        leaveId: 'leave123',
                        message: 'Leave created successfully.',
                        createdLeave: mockCreatedLeave
                    }]
                }
            });

            const submitButton = screen.getByText('Soumettre la demande');
            await user.click(submitButton);

            await waitFor(() => {
                expectToHaveBeenCalledWith(mockedAxios.post, '/api/leaves/batch', [
                    objectContaining({
                        userId: parseInt(mockUser.id, 10),
                        startDate: '2024-09-02',
                        endDate: '2024-09-03',
                        typeCode: 'ANNUAL',
                        reason: 'Vacances annuelles',
                    })
                ]);
                // Vérifier que certains champs ne sont pas envoyés à l'API
                if (mockedAxios.post.mock.calls.length > 0) {
                    const mockCall = mockedAxios.post.mock.calls[0];
                    if (mockCall && mockCall.length > 1 && Array.isArray(mockCall[1]) && mockCall[1].length > 0) {
                        const arg = mockCall[1][0];
                        expectToBeUndefined(arg.countedDays);
                        expectToBeUndefined(arg.isHalfDay);
                        expectToBeUndefined(arg.halfDayPeriod);
                    }
                }
            });

            expectToHaveBeenCalledWith(mockOnSuccess, mockCreatedLeave);
            expectToHaveBeenCalledWith(mockedToast.success, 'Leave created successfully.');
            expectToHaveValue(screen.getByLabelText(/Motif/), '');
        });

        it('should handle API error from /api/leaves/batch on submit', async () => {
            simulateDateSelection(validStartDate, validEndDate, 'success');

            let rendered;
            await act(async () => {
                rendered = renderTheForm();
            });

            // Attendre que le fetch se termine
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const user = userEvent.setup();

            const leaveTypeSelectField = screen.getByLabelText('Type de congé');
            await waitFor(() => { expect(leaveTypeSelectField).not.toBeDisabled(); }, { timeout: 5000 });
            await user.selectOptions(leaveTypeSelectField, 'ANNUAL');

            await fillDatesInForm(user, '02/09/2024', '03/09/2024');
            // Attendre que le calcul soit en succès
            await screen.findByText(/Jours décomptés : 2/i, {}, { timeout: 3000 });

            await user.type(screen.getByLabelText(/Motif/), 'Test motif API error');

            mockedAxios.post.mockResolvedValue({
                data: {
                    results: [{
                        input: { userId: parseInt(mockUser.id, 10), startDate: '2024-09-02', endDate: '2024-09-03', typeCode: 'ANNUAL' },
                        success: false,
                        message: 'Conflict with existing leave.'
                    }]
                }
            });

            const submitButton = screen.getByText('Soumettre la demande');
            await user.click(submitButton);

            await waitFor(() => {
                expectToHaveBeenCalledWith(mockedAxios.post, '/api/leaves/batch', anyValue(Array));
            });

            expectNotToHaveBeenCalled(mockOnSuccess);
            expectToHaveBeenCalledWith(mockedToast.error, 'Conflict with existing leave.');
            expectToBeInDocument(screen.getByText('Conflict with existing leave.'));
        });

        it('should handle general network error on submit', async () => {
            simulateDateSelection(validStartDate, validEndDate, 'success');

            let rendered;
            await act(async () => {
                rendered = renderTheForm();
            });

            // Attendre que le fetch se termine
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const user = userEvent.setup();

            const leaveTypeSelectField = screen.getByLabelText('Type de congé');
            await waitFor(() => { expect(leaveTypeSelectField).not.toBeDisabled(); }, { timeout: 5000 });
            await user.selectOptions(leaveTypeSelectField, 'ANNUAL');

            await fillDatesInForm(user, '02/09/2024', '03/09/2024');
            // Attendre que le calcul soit en succès
            await screen.findByText(/Jours décomptés : 2/i, {}, { timeout: 3000 });

            await user.type(screen.getByLabelText(/Motif/), 'Test network error');

            mockedAxios.post.mockRejectedValue(new Error('Network Error'));

            const submitButton = screen.getByText('Soumettre la demande');
            await user.click(submitButton);

            await waitFor(() => {
                expectToHaveBeenCalledWith(mockedAxios.post, '/api/leaves/batch', anyValue(Array));
            });

            expectNotToHaveBeenCalled(mockOnSuccess);
            expectToHaveBeenCalledWith(mockedToast.error, 'Network Error');
            expectToBeInDocument(screen.getByText('Network Error'));
        });

        it('should not submit if calculation is not successful', async () => {
            // Configurer le mock pour que useLeaveCalculation retourne status: 'loading'
            // quand les dates valides sont fournies.
            mockUseLeaveCalculation.mockImplementation((args) => {
                if (args.startDate?.getTime() === validStartDate.getTime() && args.endDate?.getTime() === validEndDate.getTime()) {
                    return {
                        ...defaultMockUseLeaveCalculationResult,
                        startDate: validStartDate,
                        endDate: validEndDate,
                        status: 'loading',
                        hasValidDates: true,
                        countedDays: null,
                        calculationMessage: 'Calcul des jours en cours...',
                    };
                }
                return defaultMockUseLeaveCalculationResult;
            });

            let rendered;
            await act(async () => {
                rendered = renderTheForm();
            });

            // Attendre que le fetch se termine
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            const user = userEvent.setup();

            const leaveTypeSelectField = screen.getByLabelText('Type de congé');
            await waitFor(() => { expect(leaveTypeSelectField).not.toBeDisabled(); }, { timeout: 5000 });
            await user.selectOptions(leaveTypeSelectField, 'ANNUAL');

            await fillDatesInForm(user, '02/09/2024', '03/09/2024');
            // Le hook est mocké pour retourner 'loading' avec ces dates.
            await screen.findByText(/Calcul des jours en cours.../i, {}, { timeout: 3000 });

            const submitButton = screen.getByText('Soumettre la demande');
            await user.click(submitButton);

            expectNotToHaveBeenCalled(mockedAxios.post);
            expectToHaveBeenCalledWith(mockedToast.error, "Le calcul des jours décomptés n'a pas pu être finalisé. Veuillez vérifier les dates ou les options.");
            expectToBeInDocument(screen.getByText("Le calcul des jours décomptés est en erreur ou incomplet."));
        });
    });

    // Les tests 'renders correctly in create mode' et 'renders correctly in edit mode'
    // utilisaient 'defaultProps' qui n'est plus correct car LeaveFormProps a changé.
    // Le mode "edit" n'est pas géré par ce composant LeaveForm (il n'a pas de prop initialData).
    // Je commente ces tests pour l'instant.

    // test('renders correctly in create mode', () => {
    //     renderTheForm(); // Utilise maintenant les props correctes via renderTheForm
    //     expect(screen.getByText(/Nouvelle demande de congé/i)).toBeInTheDocument();
    //     expect(screen.getByLabelText(/Type de congé/i)).toBeInTheDocument();
    //     // ... autres assertions pour le mode création
    // });

    // test('renders correctly in edit mode', () => {
    //     // Ce test n'est plus applicable car LeaveForm ne gère pas initialData pour un mode édition.
    //     // const initialData: Partial<LeaveFormValues> = { ... };
    //     // renderTheForm({ /* ici on ne peut pas passer initialData */ });
    //     // ... assertions pour le mode édition (à revoir si un composant d'édition séparé existe)
    // });
}); 