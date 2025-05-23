import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlocPlanningTemplateEditor from '../BlocPlanningTemplateEditor';
import { AffectationType, PlanningTemplate, ConfigurationVariation } from '../../types/template';

// Mock de react-dnd
jest.mock('react-dnd', () => ({
    useDrag: () => [{ isDragging: false }, jest.fn()],
    useDrop: () => [{}, jest.fn()],
    DndProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-dnd-html5-backend', () => ({
    HTML5Backend: 'mockBackend',
}));

// Mock pour le composant AssignmentConfigPanel
jest.mock('../AssignmentConfigPanel', () => ({
    __esModule: true,
    default: () => <div data-testid="mock-assignment-config">Configuration mockée</div>,
}));

// Mock pour le composant VariationConfigPanel
jest.mock('../VariationConfigPanel', () => ({
    __esModule: true,
    default: ({ variation, onChange, onDelete }: any) => (
        <div data-testid="mock-variation-config">
            <input
                data-testid="mock-variation-name"
                defaultValue={variation.nom}
                onChange={e => onChange({ ...variation, nom: e.target.value })}
            />
            <button data-testid="mock-variation-delete" onClick={onDelete}>Supprimer</button>
        </div>
    ),
}));

describe('BlocPlanningTemplateEditor', () => {
    const mockAvailableTypes: AffectationType[] = ['CONSULTATION', 'BLOC_OPERATOIRE', 'GARDE_JOUR', 'GARDE_NUIT', 'ASTREINTE'];

    const mockVariation: ConfigurationVariation = {
        id: 'var-123',
        affectationId: 'aff-1',
        nom: 'Variation Été',
        priorite: 5,
        configuration: {
            id: 'conf-var-123',
            postes: [
                {
                    id: 'poste-var-1',
                    nom: 'Médecin',
                    quantite: 2,
                    status: 'REQUIS'
                }
            ]
        },
        typeVariation: 'ETE',
        dateDebut: '2025-06-01',
        dateFin: '2025-09-30'
    };

    const mockTemplate: PlanningTemplate = {
        id: 'test-123',
        nom: 'Trame Test',
        affectations: [
            {
                id: 'aff-1',
                jour: 'LUNDI',
                type: 'CONSULTATION',
                ouvert: true,
                postesRequis: 2,
            },
            {
                id: 'aff-2',
                jour: 'MARDI',
                type: 'BLOC_OPERATOIRE',
                ouvert: false,
                postesRequis: 0,
            },
        ],
        variations: [mockVariation]
    };

    const mockSave = jest.fn();
    const mockAvailablePostes = ['Médecin', 'Infirmier', 'Aide-soignant'];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with initial template', () => {
        render(
            <BlocPlanningTemplateEditor
                initialTemplate={mockTemplate}
                availableAffectationTypes={mockAvailableTypes}
                availablePostes={mockAvailablePostes}
                onSave={mockSave}
            />
        );

        // Vérifier le champ de nom
        const nameInput = screen.getByDisplayValue('Trame Test');
        expect(nameInput).toBeInTheDocument();

        // Vérifier les jours affichés
        expect(screen.getByRole('tab', { name: /lundi/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /mardi/i })).toBeInTheDocument();

        // Vérifier les affectations (plusieurs peuvent exister)
        const consultations = screen.getAllByText('CONSULTATION');
        expect(consultations.length).toBeGreaterThan(0);
    });

    it('allows switching to variations tab', async () => {
        render(
            <BlocPlanningTemplateEditor
                initialTemplate={mockTemplate}
                availableAffectationTypes={mockAvailableTypes}
                availablePostes={mockAvailablePostes}
                onSave={mockSave}
            />
        );

        // Cliquer sur l'onglet des variations
        const variationsTab = screen.getByRole('tab', { name: /variations/i });
        fireEvent.click(variationsTab);

        // Vérifier que le contenu des variations est affiché
        await waitFor(() => {
            expect(screen.getByText('Variation Été')).toBeInTheDocument();
        });
    });

    it('allows adding a new affectation', () => {
        render(
            <BlocPlanningTemplateEditor
                initialTemplate={mockTemplate}
                availableAffectationTypes={mockAvailableTypes}
                availablePostes={mockAvailablePostes}
                onSave={mockSave}
            />
        );

        // Sélectionner un type d'affectation par role
        const typeSelect = screen.getByRole('combobox');
        fireEvent.mouseDown(typeSelect);
        const gardeOption = screen.getByRole('option', { name: /garde_jour/i });
        fireEvent.click(gardeOption);

        // Cliquer sur le bouton pour ajouter (texte exact)
        const addButton = screen.getByRole('button', { name: /^Ajouter$/i });
        fireEvent.click(addButton);

        // Vérifier que la nouvelle affectation apparaît
        expect(screen.getAllByText(/ouvert/i)).toHaveLength(2);
    });

    it('opens variation dialog when add variation button is clicked', () => {
        render(
            <BlocPlanningTemplateEditor
                initialTemplate={mockTemplate}
                availableAffectationTypes={mockAvailableTypes}
                availablePostes={mockAvailablePostes}
                onSave={mockSave}
            />
        );

        // Trouver le bouton d'ajout de variation par role et name (aria-label)
        const addVariationButton = screen.getByRole('button', { name: /ajouter une variation/i });
        fireEvent.click(addVariationButton);

        // Vérifier que le dialogue s'ouvre
        expect(screen.getByTestId('mock-variation-config')).toBeInTheDocument();
    });

    it('saves a variation when edited', async () => {
        render(
            <BlocPlanningTemplateEditor
                initialTemplate={mockTemplate}
                availableAffectationTypes={mockAvailableTypes}
                availablePostes={mockAvailablePostes}
                onSave={mockSave}
            />
        );

        // Cliquer sur l'onglet des variations
        const variationsTab = screen.getByRole('tab', { name: /variations/i });
        fireEvent.click(variationsTab);

        // Éditer une variation existante
        const editButton = screen.getByRole('button', { name: /éditer la variation/i });
        fireEvent.click(editButton);

        // Attendre que le dialogue s'ouvre et que le mock soit là
        await waitFor(() => {
            expect(screen.getByTestId('mock-variation-config')).toBeInTheDocument();
        });

        // Modifier le nom de la variation via le mock
        const nameInput = screen.getByTestId('mock-variation-name');
        fireEvent.change(nameInput, { target: { value: 'Nouvelle Variation' } });

        // Fermer le dialogue (en cliquant sur le bouton "Fermer" du dialogue)
        const closeButton = screen.getByRole('button', { name: /fermer/i });
        fireEvent.click(closeButton);

        // Attendre que le bouton Enregistrer principal soit disponible et le cliquer
        const saveEditorButton = await screen.findByRole('button', { name: /enregistrer/i });
        fireEvent.click(saveEditorButton);

        // Attendre et vérifier que la fonction onSave a été appelée
        await waitFor(() => {
            expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
                variations: expect.arrayContaining([
                    expect.objectContaining({ id: 'var-123', nom: 'Nouvelle Variation' })
                ])
            }));
        });
    });

    it('deletes a variation when delete button is clicked', async () => {
        render(
            <BlocPlanningTemplateEditor
                initialTemplate={mockTemplate}
                availableAffectationTypes={mockAvailableTypes}
                availablePostes={mockAvailablePostes}
                onSave={mockSave}
            />
        );

        // Cliquer sur l'onglet des variations
        const variationsTab = screen.getByRole('tab', { name: /variations/i });
        fireEvent.click(variationsTab);

        // Supprimer une variation existante par role et name (aria-label)
        const deleteButton = screen.getByRole('button', { name: /supprimer/i });
        fireEvent.click(deleteButton);

        // Sauvegarder les modifications
        const saveButton = screen.getByRole('button', { name: /enregistrer/i });
        fireEvent.click(saveButton);

        // Vérifier que la variation a été supprimée
        expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
            variations: []
        }));
    });

    it('validates template before saving', () => {
        const invalidTemplate = {
            ...mockTemplate,
            nom: '' // Nom invalide (vide)
        };

        render(
            <BlocPlanningTemplateEditor
                initialTemplate={invalidTemplate}
                availableAffectationTypes={mockAvailableTypes}
                availablePostes={mockAvailablePostes}
                onSave={mockSave}
            />
        );

        // Tenter de sauvegarder
        const saveButton = screen.getByRole('button', { name: /enregistrer/i });
        fireEvent.click(saveButton);

        // Vérifier que le save n'a pas été appelé à cause des erreurs de validation
        expect(mockSave).not.toHaveBeenCalled();
    });
}); 