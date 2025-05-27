import { templateIntegrationService } from '../templateIntegrationService';
import { templateService } from '../templateService';
import { AffectationConfiguration } from '../../types/template';
import { act } from '@testing-library/react';

// Mock du service de modèles
jest.mock('../templateService', () => ({
    templateService: {
        getTemplateById: jest.fn(),
        duplicateTemplate: jest.fn(),
        saveTemplate: jest.fn(),
        exportTemplateAsJSON: jest.fn(),
        importTemplateFromJSON: jest.fn()
    }
}));

// Mock des objets du DOM pour le download
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('templateIntegrationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const mockAnchor = {
            href: '',
            download: '',
            click: jest.fn(),
        };
        const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation(() => mockAnchor as any);
        const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => { });
        const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('exportTemplateToJSON', () => {
        test('devrait appeler le service sous-jacent et retourner le résultat', async () => {
            const mockBlob = new Blob(['{}'], { type: 'application/json' });
            (templateService.exportTemplateAsJSON as jest.Mock).mockResolvedValue(mockBlob);

            const result = await templateIntegrationService.exportTemplateToJSON('tmpl_1');
            expect(templateService.exportTemplateAsJSON).toHaveBeenCalledWith('tmpl_1');
            expect(result).toBe(mockBlob);
        });

        test('devrait propager les erreurs', async () => {
            const error = new Error('Erreur d\'exportation');
            (templateService.exportTemplateAsJSON as jest.Mock).mockRejectedValue(error);
            await expect(templateIntegrationService.exportTemplateToJSON('tmpl_1')).rejects.toThrow(error);
        });
    });

    describe('downloadTemplateAsJSON', () => {
        beforeAll(() => {
            jest.useFakeTimers();
        });
        afterAll(() => {
            jest.useRealTimers();
        });

        test('devrait télécharger la trameModele avec un nom de fichier généré', async () => {
            const mockTemplate = { id: 'tmpl_1', nom: 'TrameModele Test' };
            const mockBlob = new Blob(['{}'], { type: 'application/json' });

            (templateService.getTemplateById as jest.Mock).mockResolvedValue(mockTemplate);
            (templateService.exportTemplateAsJSON as jest.Mock).mockResolvedValue(mockBlob);
            (global.URL.createObjectURL as jest.Mock).mockReturnValue('blob:url');

            await templateIntegrationService.downloadTemplateAsJSON('tmpl_1');
            expect(templateService.getTemplateById).toHaveBeenCalledWith('tmpl_1');
            expect(templateService.exportTemplateAsJSON).toHaveBeenCalledWith('tmpl_1');
            expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);

            const anchor = document.createElement('a');
            expect(anchor.href).toBe('blob:url');
            expect(anchor.download).toBe('trame_trame_test.json');
            expect(anchor.click).toHaveBeenCalled();
            expect(document.body.appendChild).toHaveBeenCalled();
            expect(document.body.removeChild).toHaveBeenCalled();

            act(() => {
                jest.runAllTimers();
            });
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
        });

        test('devrait utiliser le nom de fichier fourni s\'il est spécifié', async () => {
            const mockTemplate = { id: 'tmpl_1', nom: 'TrameModele Test' };
            const mockBlob = new Blob(['{}'], { type: 'application/json' });

            (templateService.getTemplateById as jest.Mock).mockResolvedValue(mockTemplate);
            (templateService.exportTemplateAsJSON as jest.Mock).mockResolvedValue(mockBlob);
            (global.URL.createObjectURL as jest.Mock).mockReturnValue('blob:url');

            await templateIntegrationService.downloadTemplateAsJSON('tmpl_1', 'export_custom.json');

            const anchor = document.createElement('a');
            expect(anchor.download).toBe('export_custom.json');

            act(() => {
                jest.runAllTimers();
            });
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
        });

        test('devrait gérer les erreurs lors de la récupération de la trameModele', async () => {
            const error = new Error('Modèle non trouvé');
            (templateService.getTemplateById as jest.Mock).mockResolvedValue(null);
            await expect(templateIntegrationService.downloadTemplateAsJSON('tmpl_not_found')).rejects.toThrow('TrameModele avec l\'ID tmpl_not_found non trouvée');
        });
    });

    describe('importTemplateFromJSON', () => {
        test('devrait appeler le service sous-jacent et retourner le résultat', async () => {
            const mockFile = new File(['{}'], 'import.json', { type: 'application/json' });
            const mockTemplate = { id: 'tmpl_imported', nom: 'TrameModele Importée' };

            (templateService.importTemplateFromJSON as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await templateIntegrationService.importTemplateFromJSON(mockFile);

            expect(templateService.importTemplateFromJSON).toHaveBeenCalledWith(mockFile);
            expect(result).toBe(mockTemplate);
        });

        test('devrait propager les erreurs', async () => {
            const mockFile = new File(['{}'], 'import.json', { type: 'application/json' });
            const error = new Error('Format invalide');

            (templateService.importTemplateFromJSON as jest.Mock).mockRejectedValue(error);

            await expect(templateIntegrationService.importTemplateFromJSON(mockFile)).rejects.toThrow(error);
        });
    });

    describe('duplicateTemplate', () => {
        test('devrait dupliquer une trameModele en utilisant le nouveau nom fourni', async () => {
            const mockDuplicatedTemplate = { id: 'tmpl_dupe', nom: 'TrameModele Test (Copie)' };
            const mockUpdatedTemplate = { ...mockDuplicatedTemplate, nom: 'Nouveau Nom' };

            (templateService.duplicateTemplate as jest.Mock).mockResolvedValue(mockDuplicatedTemplate);
            (templateService.saveTemplate as jest.Mock).mockResolvedValue(mockUpdatedTemplate);

            const result = await templateIntegrationService.duplicateTemplate('tmpl_1', 'Nouveau Nom');

            expect(templateService.duplicateTemplate).toHaveBeenCalledWith('tmpl_1');
            expect(templateService.saveTemplate).toHaveBeenCalledWith(expect.objectContaining({
                id: 'tmpl_dupe',
                nom: 'Nouveau Nom'
            }));
            expect(result).toBe(mockUpdatedTemplate);
        });

        test('devrait dupliquer une trameModele sans changer le nom si non spécifié', async () => {
            const mockDuplicatedTemplate = { id: 'tmpl_dupe', nom: 'TrameModele Test (Copie)' };

            (templateService.duplicateTemplate as jest.Mock).mockResolvedValue(mockDuplicatedTemplate);

            const result = await templateIntegrationService.duplicateTemplate('tmpl_1');

            expect(templateService.duplicateTemplate).toHaveBeenCalledWith('tmpl_1');
            expect(templateService.saveTemplate).not.toHaveBeenCalled();
            expect(result).toBe(mockDuplicatedTemplate);
        });

        test('devrait propager les erreurs', async () => {
            const error = new Error('Erreur de duplication');
            (templateService.duplicateTemplate as jest.Mock).mockRejectedValue(error);

            await expect(templateIntegrationService.duplicateTemplate('tmpl_1')).rejects.toThrow(error);
        });
    });

    describe('applyTemplateToPlanning', () => {
        test('devrait appliquer une trameModele à un planning et retourner un ID', async () => {
            const mockTemplate = { id: 'tmpl_1', nom: 'TrameModele Test' };
            const dateDebut = new Date(2025, 0, 1);
            const dateFin = new Date(2025, 0, 31);

            (templateService.getTemplateById as jest.Mock).mockResolvedValue(mockTemplate);

            const result = await templateIntegrationService.applyTemplateToPlanning('tmpl_1', dateDebut, dateFin);

            expect(templateService.getTemplateById).toHaveBeenCalledWith('tmpl_1');
            expect(result).toMatch(/^planning_\d+$/);
        });

        test('devrait rejeter si la trameModele n\'existe pas', async () => {
            const dateDebut = new Date(2025, 0, 1);
            const dateFin = new Date(2025, 0, 31);

            (templateService.getTemplateById as jest.Mock).mockResolvedValue(null);

            await expect(templateIntegrationService.applyTemplateToPlanning('tmpl_not_found', dateDebut, dateFin))
                .rejects.toThrow('TrameModele avec l\'ID tmpl_not_found non trouvée');
        });
    });

    describe('compareConfigurations', () => {
        test('devrait détecter les différences entre deux configurations', () => {
            const configA: AffectationConfiguration = {
                id: 'conf_a',
                nom: 'Config A',
                heureDebut: '08:00',
                heureFin: '12:00',
                priorite: 1,
                couleur: '#ff0000',
                postes: [
                    { id: 'poste_a1', nom: 'Médecin', quantite: 1, status: 'REQUIS' },
                    { id: 'poste_a2', nom: 'Infirmier', quantite: 1, status: 'REQUIS' }
                ]
            };

            const configB: AffectationConfiguration = {
                id: 'conf_b',
                nom: 'Config B',
                heureDebut: '09:00',
                heureFin: '12:00',
                priorite: 2,
                couleur: '#ff0000',
                postes: [
                    { id: 'poste_b1', nom: 'Médecin', quantite: 2, status: 'REQUIS' },
                    { id: 'poste_b2', nom: 'Infirmier', quantite: 1, status: 'OPTIONNEL' }
                ]
            };

            const differences = templateIntegrationService.compareConfigurations(configA, configB);

            expect(differences).toHaveProperty('nom');
            expect(differences).toHaveProperty('heureDebut');
            expect(differences).toHaveProperty('priorite');
            expect(differences).not.toHaveProperty('couleur');
            expect(differences).toHaveProperty('postes.Médecin.quantite');
            expect(differences).toHaveProperty('postes.Infirmier.status');
        });

        test('devrait comparer correctement les configurations avec nombres différents de postes', () => {
            const configA: AffectationConfiguration = {
                id: 'conf_a',
                postes: [
                    { id: 'poste_a1', nom: 'Médecin', quantite: 1, status: 'REQUIS' }
                ]
            };

            const configB: AffectationConfiguration = {
                id: 'conf_b',
                postes: [
                    { id: 'poste_b1', nom: 'Médecin', quantite: 1, status: 'REQUIS' },
                    { id: 'poste_b2', nom: 'Infirmier', quantite: 1, status: 'REQUIS' }
                ]
            };

            const differences = templateIntegrationService.compareConfigurations(configA, configB);

            expect(differences).toHaveProperty('postes.count');
            expect(differences.postes.count).toEqual({ from: 1, to: 2 });
        });
    });

    describe('checkTemplateCompatibility', () => {
        test('devrait vérifier la compatibilité d\'une trameModele avec un planning existant', async () => {
            const result = await templateIntegrationService.checkTemplateCompatibility('tmpl_1', 'planning_1');

            expect(result).toHaveProperty('isCompatible');
            expect(result).toHaveProperty('conflicts');
            expect(Array.isArray(result.conflicts)).toBe(true);
        });
    });
}); 