import { TypeSemaine, JourSemaine, PeriodeJour } from "@/app/parametres/tableaux de service/EditeurTramesHebdomadaires";
import { RecurrenceTypeTrame, TypeSemaineTrame } from '@prisma/client';
import { getClientAuthToken } from '@/lib/auth-client-utils';

export interface AffectationTrameDTO {
    id: string;
    jourSemaine: JourSemaine;
    periode: PeriodeJour;
    salleId?: string | null;
    chirurgienId?: string | null;
    marId?: string | null;
    iadeId?: string | null;
    // Autres champs potentiels si l'API les fournit pour les gardes/vacations d'un TrameModele
}

export interface TrameHebdomadaireDTO { // Ce DTO représente ce que TrameHebdomadaireService s'attend à manipuler/retourner
    // Il doit correspondre aux données réellement retournées par l'API /api/tableau de service-modeles (TrameModele Prisma)
    id: number | string; // L'API retourne un number pour l'id
    name: string; // Correction : champ obligatoire
    nom?: string; // Optionnel, pour compatibilité descendante
    typeSemaine: TypeSemaineTrame | TypeSemaine; // 'typeSemaine' dans l'API (enum Prisma), TypeSemaine côté client
    description?: string | null;
    gardes/vacations?: AffectationTrameDTO[]; // Les TrameModele n'ont pas d'gardes/vacations directes, ce champ sera souvent vide/null venant de l'API principale

    // Champs présents dans TrameModele (API) et utiles pour le mapping vers PlanningTemplate
    createdAt?: string | Date; // API retourne string (ISO date)
    updatedAt?: string | Date; // API retourne string (ISO date)
    isActive?: boolean;
    siteId?: string | null;
    dateDebutEffet?: string | Date;
    dateFinEffet?: string | Date | null;
    recurrenceType?: RecurrenceTypeTrame;
    joursSemaineActifs?: number[];
    // Et tout autre champ de TrameModele que l'on veut exposer via ce DTO
}

interface CreateTrameModelePayload { // Ce qui est envoyé à l'API pour la création
    name: string;
    description?: string | null;
    siteId?: string | null;
    isActive?: boolean;
    dateDebutEffet: string;
    dateFinEffet?: string | null;
    recurrenceType: RecurrenceTypeTrame;
    joursSemaineActifs: number[];
    typeSemaine: TypeSemaineTrame;
}

export class TrameHebdomadaireService {
    private static API_BASE_URL = '/api/tableau de service-modeles';

    private static getAuthHeaders(): HeadersInit {
        console.log('[TrameHebdomadaireService] Entrée dans getAuthHeaders');
        const token = getClientAuthToken();
        console.log('[TrameHebdomadaireService] Token récupéré par getClientAuthToken:', token);
        // Si on est en train de créer une session ou d'envoyer un form, on laisse credentials mettre le cookie
        // Sinon, on ajoute explicitement le token dans le header Authorization
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('[TrameHebdomadaireService] Authorization header ajouté:', headers['Authorization']);
        } else {
            console.warn('[TrameHebdomadaireService] Aucun token trouvé dans localStorage');
        }

        return headers;
    }

    /**
     * Récupère toutes les tableaux de service modèles (anciennement tableaux de service hebdomadaires)
     */
    static async getAllTrames(): Promise<TrameHebdomadaireDTO[]> {
        try {
            const headers = this.getAuthHeaders();
            console.log('[TrameHebdomadaireService] Appel à getAllTrames avec headers:', JSON.stringify(headers));
            const response = await fetch(`${this.API_BASE_URL}`, {
                method: 'GET',
                headers,
                cache: 'no-store',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Erreur 401 (Non autorisé) pour getAllTrames. Vérifiez le token.');
                } else {
                    console.warn(`Erreur API (${response.status}) lors de la récupération des tableaux de service modèles. Retour d'un tableau vide.`);
                }
                return [];
            }
            const data = await response.json();
            console.log('[TrameHebdomadaireService] Données brutes de /api/tableau de service-modeles (getAllTrames):', JSON.stringify(data)); // LOG AJOUTÉ

            if (!Array.isArray(data)) {
                console.error('Erreur: Les données reçues pour getAllTrames ne sont pas un tableau.', data);
                return [];
            }

            // Vérifier si les tableaux de service ont des gardes/vacations
            const trameSample = data.length > 0 ? data[0] : null;
            if (trameSample) {
                console.log(`[TrameHebdomadaireService] Premier élément a des gardes/vacations? ${trameSample.gardes/vacations !== undefined}`);
                console.log(`[TrameHebdomadaireService] Premier élément - propriétés disponibles: ${Object.keys(trameSample).join(', ')}`);
            }

            return data;
        } catch (error) {
            console.error("[TrameHebdomadaireService] Erreur lors de la récupération des tableaux de service modèles (service catch getAllTrames):", error);
            return [];
        }
    }

    /**
     * Récupère une tableau de service modèle spécifique par son ID
     */
    static async getTrameById(id: string): Promise<TrameHebdomadaireDTO | null> { // Modifié pour retourner null si non trouvé ou erreur
        try {
            const headers = this.getAuthHeaders();
            const response = await fetch(`${this.API_BASE_URL}/${id}`, {
                method: 'GET',
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error(`Erreur 401 (Non autorisé) pour getTrameById ${id}. Vérifiez le token.`);
                } else if (response.status === 404) {
                    console.warn(`Tableau de service modèle ${id} non trouvée (404).`);
                } else {
                    console.warn(`Erreur API (${response.status}) lors de la récupération de la tableau de service modèle ${id}.`);
                }
                return null;
            }
            // On pourrait ajouter une validation de la structure de l'objet ici si nécessaire
            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de la récupération de la tableau de service modèle ${id} (service):`, error);
            return null;
        }
    }

    /**
     * Crée une nouvelle tableau de service modèle
     */
    static async createTrame(trameClientData: Omit<TrameHebdomadaireDTO, 'id' | 'gardes/vacations'>): Promise<any> {
        console.log('[TrameHebdomadaireService] Entrée dans createTrame avec données:', trameClientData);
        let typeSemaineApi: TypeSemaineTrame;
        switch (trameClientData.typeSemaine) {
            case TypeSemaine.PAIRE:
                typeSemaineApi = TypeSemaineTrame.PAIRES;
                break;
            case TypeSemaine.IMPAIRE:
                typeSemaineApi = TypeSemaineTrame.IMPAIRES;
                break;
            case TypeSemaine.TOUTES:
            default:
                typeSemaineApi = TypeSemaineTrame.TOUTES;
                break;
        }

        const payload: CreateTrameModelePayload = {
            name: trameClientData.name,
            description: trameClientData.description || null,
            isActive: true,
            dateDebutEffet: new Date().toISOString(), // Devrait peut-être venir du client
            recurrenceType: RecurrenceTypeTrame.HEBDOMADAIRE, // Valeurs par défaut
            joursSemaineActifs: [1, 2, 3, 4, 5], // Valeurs par défaut (Lundi à Vendredi)
            typeSemaine: typeSemaineApi,
            // siteId: 'default_site_id', // TODO: Le siteId est requis par TrameModele, à gérer
        };

        try {
            const headers = this.getAuthHeaders();
            console.log('[TrameHebdomadaireService] Création de tableau de service avec payload:', JSON.stringify(payload));
            console.log('[TrameHebdomadaireService] Headers pour createTrame:', JSON.stringify(headers));

            const response = await fetch(`${this.API_BASE_URL}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                cache: 'no-store',
                credentials: 'include'
            });

            if (!response.ok) {
                const statusText = response.statusText;
                console.error(`[TrameHebdomadaireService] Erreur ${response.status} (${statusText}) lors de la création`);

                let errorBody;
                try {
                    errorBody = await response.json();
                } catch (e) {
                    errorBody = {
                        message: 'Réponse non JSON de l\'API ou erreur de parsing.',
                        details: statusText
                    };
                }

                if (response.status === 409) {
                    console.error('[TrameHebdomadaireService] Erreur API création tableau de service modèle (409 Conflict):', errorBody);
                    throw new Error(errorBody.message || 'Un modèle de tableau de service avec ce nom existe déjà.');
                } else if (response.status === 401) {
                    console.error('[TrameHebdomadaireService] Erreur API création tableau de service modèle (401 Unauthorized):', errorBody);
                    throw new Error(errorBody.message || 'Action non autorisée. Vérifiez vos permissions ou reconnectez-vous.');
                }

                console.error('[TrameHebdomadaireService] Erreur API création tableau de service modèle:', response.status, errorBody);
                throw new Error(`Erreur lors de la création de la tableau de service modèle: ${response.status} - ${errorBody.message || statusText}`);
            }

            const result = await response.json();
            console.log('[TrameHebdomadaireService] Tableau de service créée avec succès:', result);
            return result;
        } catch (error) {
            console.error("Erreur lors de la création de la tableau de service modèle (service catch):", error);
            // Rethrow l'erreur pour qu'elle soit traitée par le composant appelant
            // Si l'erreur est déjà une instance de Error avec un message pertinent, la relancer telle quelle.
            // Sinon, encapsuler dans une nouvelle Error.
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Une erreur technique est survenue lors de la création de la tableau de service.');
        }
    }

    /**
     * Met à jour une tableau de service existante
     */
    static async updateTrame(id: string, tableau de service: TrameHebdomadaireDTO): Promise<TrameHebdomadaireDTO> {
        // Mapping typeSemaine client -> API
        let typeSemaineApi: TypeSemaineTrame;
        switch (tableau de service.typeSemaine) {
            case TypeSemaine.PAIRE:
                typeSemaineApi = TypeSemaineTrame.PAIRES;
                break;
            case TypeSemaine.IMPAIRE:
                typeSemaineApi = TypeSemaineTrame.IMPAIRES;
                break;
            case TypeSemaine.TOUTES:
            default:
                typeSemaineApi = TypeSemaineTrame.TOUTES;
                break;
        }

        // Préparer le payload de mise à jour
        const updatePayload = {
            name: tableau de service.name || tableau de service.nom, // Compatibilité avec les deux champs
            description: tableau de service.description,
            // On ne modifie que les champs fournis, les autres restent inchangés
            isActive: tableau de service.isActive,
            typeSemaine: typeSemaineApi,
            // Ces champs peuvent être ajoutés si nécessaires pour la mise à jour
            // dateDebutEffet: tableau de service.dateDebutEffet,
            // dateFinEffet: tableau de service.dateFinEffet,
            // recurrenceType: tableau de service.recurrenceType || RecurrenceTypeTrame.HEBDOMADAIRE,
            // joursSemaineActifs: [1, 2, 3, 4, 5],
        };

        try {
            const headers = this.getAuthHeaders();
            console.log('[TrameHebdomadaireService] Mise à jour de tableau de service avec payload:', JSON.stringify(updatePayload));

            const response = await fetch(`${this.API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(updatePayload),
                credentials: 'include'
            });

            if (!response.ok) {
                const statusText = response.statusText;
                console.error(`[TrameHebdomadaireService] Erreur ${response.status} (${statusText}) lors de la mise à jour`);

                let errorBody;
                try {
                    errorBody = await response.json();
                } catch (e) {
                    errorBody = {
                        message: 'Réponse non JSON de l\'API ou erreur de parsing.',
                        details: statusText
                    };
                }

                console.error('[TrameHebdomadaireService] Erreur API mise à jour tableau de service modèle:', response.status, errorBody);
                throw new Error(`Erreur lors de la mise à jour de la tableau de service modèle: ${response.status} - ${errorBody.message || statusText}`);
            }

            const result = await response.json();
            console.log('[TrameHebdomadaireService] Tableau de service mise à jour avec succès:', result);
            return result;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la tableau de service modèle (service catch):", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Une erreur technique est survenue lors de la mise à jour de la tableau de service.');
        }
    }

    /**
     * Supprime une tableau de service existante
     */
    static async deleteTrame(id: string): Promise<boolean> {
        try {
            const headers = this.getAuthHeaders();
            console.log('[TrameHebdomadaireService] Suppression de la tableau de service modèle:', id);

            const response = await fetch(`${this.API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers,
                credentials: 'include'
            });

            if (!response.ok) {
                const statusText = response.statusText;
                console.error(`[TrameHebdomadaireService] Erreur ${response.status} (${statusText}) lors de la suppression`);

                let errorBody;
                try {
                    errorBody = await response.json();
                } catch (e) {
                    errorBody = {
                        message: 'Réponse non JSON de l\'API ou erreur de parsing.',
                        details: statusText
                    };
                }

                console.error('[TrameHebdomadaireService] Erreur API suppression tableau de service modèle:', response.status, errorBody);
                throw new Error(`Erreur lors de la suppression de la tableau de service modèle: ${response.status} - ${errorBody.message || statusText}`);
            }

            // Si la réponse est un JSON, on peut la lire, sinon on retourne simplement true
            try {
                const result = await response.json();
                console.log('[TrameHebdomadaireService] Résultat de la suppression:', result);
                return true;
            } catch (e) {
                // Si pas de JSON, c'est OK aussi (204 No Content)
                console.log('[TrameHebdomadaireService] Tableau de service supprimée avec succès (pas de corps de réponse)');
                return true;
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de la tableau de service modèle (service catch):", error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Une erreur technique est survenue lors de la suppression de la tableau de service.');
        }
    }

    /**
     * @deprecated Utilisé uniquement comme fallback si l'API échoue
     */
    private static getMockTrames(): TrameHebdomadaireDTO[] {
        return [
            {
                id: 'tableau de service-paires-std',
                name: 'Standard Semaines PAIRES',
                typeSemaine: TypeSemaine.PAIRE,
                description: 'Configuration type pour les semaines paires',
                gardes/vacations: [
                    { id: 'aff-p1', jourSemaine: JourSemaine.LUNDI, periode: PeriodeJour.MATIN, salleId: 'salle1', chirurgienId: 'chir1', marId: 'mar1', iadeId: 'iade1' },
                    { id: 'aff-p2', jourSemaine: JourSemaine.MARDI, periode: PeriodeJour.APRES_MIDI, salleId: 'salle2', chirurgienId: 'chir2', marId: 'mar1' },
                ]
            },
            {
                id: 'tableau de service-impaires-cardio',
                name: 'Cardio Semaines IMPAIRES',
                typeSemaine: TypeSemaine.IMPAIRE,
                description: 'Rotation cardio pour les semaines impaires',
                gardes/vacations: [
                    { id: 'aff-i1', jourSemaine: JourSemaine.MERCREDI, periode: PeriodeJour.MATIN, salleId: 'salle1', chirurgienId: 'chir3', iadeId: 'iade2' },
                    { id: 'aff-i3', jourSemaine: JourSemaine.VENDREDI, periode: PeriodeJour.MATIN, salleId: 'salle3', chirurgienId: 'chir1' },
                    { id: 'aff-i4', jourSemaine: JourSemaine.VENDREDI, periode: PeriodeJour.APRES_MIDI, salleId: 'salle3', chirurgienId: 'chir1', marId: 'mar2', iadeId: 'iade1' },
                ]
            }
        ];
    }
} 