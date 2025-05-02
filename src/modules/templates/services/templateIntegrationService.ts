import { PlanningTemplate, AffectationConfiguration } from '../types/template';
import { templateService } from './templateService';

/**
 * Service d'intégration pour les trames de planning
 * Gère l'intégration avec d'autres modules, l'exportation et l'importation
 */
export const templateIntegrationService = {
    /**
     * Exporte une trame au format JSON avec métadonnées
     * @param templateId ID de la trame à exporter
     * @returns Promise avec un objet Blob contenant les données
     */
    async exportTemplateToJSON(templateId: string): Promise<Blob> {
        try {
            return await templateService.exportTemplateAsJSON(templateId);
        } catch (error) {
            console.error('Erreur lors de l\'exportation de la trame:', error);
            throw error;
        }
    },

    /**
     * Déclenche le téléchargement d'une trame au format JSON
     * @param templateId ID de la trame à télécharger
     * @param fileName Nom du fichier à générer (défaut: nom de la trame)
     */
    async downloadTemplateAsJSON(templateId: string, fileName?: string): Promise<void> {
        try {
            // Récupérer la trame pour avoir son nom si fileName n'est pas fourni
            const template = await templateService.getTemplateById(templateId);
            if (!template) {
                throw new Error(`Trame avec l'ID ${templateId} non trouvée`);
            }

            // Générer le nom du fichier si non fourni
            const safeFileName = fileName || `trame_${template.nom.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

            // Obtenir le blob JSON de la trame
            const blob = await this.exportTemplateToJSON(templateId);

            // Créer un objet URL pour le blob
            const url = URL.createObjectURL(blob);

            // Créer un élément <a> pour déclencher le téléchargement
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = safeFileName;

            // Ajouter l'élément au DOM, cliquer dessus, puis le supprimer
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Libérer l'URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error('Erreur lors du téléchargement de la trame:', error);
            throw error;
        }
    },

    /**
     * Importe une trame depuis un fichier JSON
     * @param file Fichier JSON à importer
     * @returns Promise avec la trame importée
     */
    async importTemplateFromJSON(file: File): Promise<PlanningTemplate> {
        try {
            return await templateService.importTemplateFromJSON(file);
        } catch (error) {
            console.error('Erreur lors de l\'importation de la trame:', error);
            throw error;
        }
    },

    /**
     * Duplique une trame existante avec un nouveau nom
     * @param templateId ID de la trame à dupliquer
     * @param newName Nouveau nom pour la copie (optionnel)
     * @returns Promise avec la nouvelle trame
     */
    async duplicateTemplate(templateId: string, newName?: string): Promise<PlanningTemplate> {
        try {
            const duplicatedTemplate = await templateService.duplicateTemplate(templateId);

            if (newName) {
                // Si un nouveau nom est fourni, le mettre à jour
                duplicatedTemplate.nom = newName;
                return await templateService.saveTemplate(duplicatedTemplate);
            }

            return duplicatedTemplate;
        } catch (error) {
            console.error('Erreur lors de la duplication de la trame:', error);
            throw error;
        }
    },

    /**
     * Applique une trame à un planning pour une période spécifique
     * @param templateId ID de la trame à appliquer
     * @param dateDebut Date de début de la période d'application
     * @param dateFin Date de fin de la période d'application
     * @returns Promise avec l'ID du planning généré
     */
    async applyTemplateToPlanning(templateId: string, dateDebut: Date, dateFin: Date): Promise<string> {
        try {
            const template = await templateService.getTemplateById(templateId);
            if (!template) {
                throw new Error(`Trame avec l'ID ${templateId} non trouvée`);
            }

            // Cette fonction est une simulation, dans un cas réel,
            // elle communiquerait avec le module de planning
            console.log(`Application de la trame ${template.nom} du ${dateDebut.toLocaleDateString()} au ${dateFin.toLocaleDateString()}`);

            // Simuler un délai réseau
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Retourner un ID fictif de planning généré
            return `planning_${Date.now()}`;
        } catch (error) {
            console.error('Erreur lors de l\'application de la trame au planning:', error);
            throw error;
        }
    },

    /**
     * Compare deux configurations d'affectation pour détecter les différences
     * @param configA Première configuration
     * @param configB Deuxième configuration
     * @returns Objet avec les différences
     */
    compareConfigurations(configA: AffectationConfiguration, configB: AffectationConfiguration): Record<string, any> {
        const differences: Record<string, any> = {};

        // Comparer les champs simples
        for (const key of ['nom', 'heureDebut', 'heureFin', 'priorite', 'couleur', 'notes', 'emplacementPhysique'] as const) {
            if (configA[key] !== configB[key]) {
                differences[key] = {
                    from: configA[key],
                    to: configB[key]
                };
            }
        }

        // Comparer les postes
        if (configA.postes.length !== configB.postes.length) {
            differences.postes = {
                count: {
                    from: configA.postes.length,
                    to: configB.postes.length
                }
            };
        } else {
            // Comparer chaque poste individuellement
            const posteDiffs: Record<string, any> = {};
            configA.postes.forEach((posteA, index) => {
                const posteB = configB.postes[index];
                const posteChanges: Record<string, any> = {};

                for (const key of ['nom', 'quantite', 'status', 'competencesRequises'] as const) {
                    if (posteA[key] !== posteB[key]) {
                        posteChanges[key] = {
                            from: posteA[key],
                            to: posteB[key]
                        };
                    }
                }

                if (Object.keys(posteChanges).length > 0) {
                    posteDiffs[posteA.nom] = posteChanges;
                }
            });

            if (Object.keys(posteDiffs).length > 0) {
                differences.postes = posteDiffs;
            }
        }

        return differences;
    },

    /**
     * Vérifier la compatibilité d'une trame avec un planning existant
     * @param templateId ID de la trame à vérifier
     * @param planningId ID du planning existant
     * @returns Promise avec un rapport de compatibilité
     */
    async checkTemplateCompatibility(templateId: string, planningId: string): Promise<{
        isCompatible: boolean;
        conflicts: Array<{ type: string; description: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }>
    }> {
        try {
            // Cette fonction est une simulation, dans un cas réel,
            // elle vérifierait réellement la compatibilité avec le module de planning
            console.log(`Vérification de la compatibilité de la trame ${templateId} avec le planning ${planningId}`);

            // Simuler un délai réseau
            await new Promise(resolve => setTimeout(resolve, 800));

            // Retourner un résultat fictif
            return {
                isCompatible: true,
                conflicts: [
                    {
                        type: 'WARNING',
                        description: 'Certaines affectations du planning existant seront modifiées',
                        severity: 'MEDIUM'
                    }
                ]
            };
        } catch (error) {
            console.error('Erreur lors de la vérification de compatibilité:', error);
            throw error;
        }
    }
}; 