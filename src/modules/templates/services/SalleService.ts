import { logger } from "../../../lib/logger";

import { getClientAuthToken } from '@/lib/auth-client-utils'; // Importer la fonction

export interface OperatingRoomFromAPI {
    id: number; // Correspond à l'ID de la base de données (Int)
    name: string; // Correspond à OperatingRoom.name
    number: string; // Correspond à OperatingRoom.number
    colorCode?: string | null; // Correspond à OperatingRoom.colorCode
    // Ajouter d'autres champs si nécessaire (ex: isActive, secteurId, etc.)
}

export class SalleService {
    private static API_BASE_URL = '/api';

    /**
     * Récupère toutes les salles d'opération avec leurs détails, y compris la couleur
     */
    static async getSalles(): Promise<OperatingRoomFromAPI[]> {
        try {
            const token = getClientAuthToken(); // Récupérer le token depuis localStorage
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.API_BASE_URL}/operating-rooms`, {
                method: 'GET',
                headers: headers, // Utiliser les headers modifiés
                credentials: 'include' // Garder au cas où, mais le header devrait primer
            });

            if (!response.ok) {
                // Essayer de lire le corps de l'erreur pour plus de détails
                let errorBody = 'Réponse non JSON ou vide';
                try {
                    errorBody = await response.text();
                } catch (e: unknown) {
                    // Ignorer l'erreur de lecture du corps si elle échoue
                }
                logger.error(`Erreur API getSalles: ${response.status} ${response.statusText}. Body: ${errorBody}`);
                throw new Error(`Erreur lors de la récupération des salles: ${response.status}`);
            }

            const data = await response.json();
            logger.info('[SalleService] Salles chargées depuis API:', data);
            return data as OperatingRoomFromAPI[]; // S'assurer que les données correspondent à la nouvelle interface
        } catch (error: unknown) {
            logger.error("Erreur lors de la récupération des salles (catch global):", { error: error });
            // Optionnel: Mettre à jour les mocks pour correspondre à OperatingRoomFromAPI ou les supprimer si non utilisés
            // Pour l'instant, on retourne un tableau vide en cas d'erreur pour éviter d'utiliser des mocks avec une ancienne structure.
            return [];
        }
    }

    /**
     * Données mockées pour les salles d'opération - À METTRE À JOUR OU SUPPRIMER
     * Cette fonction n'est plus utilisée si l'appel API fonctionne et retourne un tableau vide en cas d'erreur.
     */
    /*
    private static getMockSalles(): OperatingRoomFromAPI[] {
        return [
            { id: 1, name: 'Salle Op 1', number: 'S1', colorCode: '#FFDDC1' }, // Exemple avec ID numérique
            { id: 2, name: 'Salle Op 2', number: 'S2', colorCode: '#C2F0C2' },
            { id: 3, name: 'Salle Endoscopie', number: 'ENDO1', colorCode: '#C1D4FF' },
            { id: 4, name: 'Salle Cardiologie', number: 'CARDIO1', colorCode: '#FFFAC1' },
            { id: 5, name: 'Salle Orthopédie', number: 'ORTHO1', colorCode: '#E0C1FF' },
            // { id: 'salle-na', name: 'N/A - Pas de salle', number: 'NA', colorCode: null } // Si on veut un ID string, adapter l'interface
        ];
    }
    */
} 