import { logger } from "../../lib/logger";

import { DisplayPersonnelIncompatibility } from '@/app/api/admin/incompatibilites/route'; // Importer le type

const API_BASE_URL = '/api/admin/incompatibilites';

export async function getPersonnelIncompatibilities(): Promise<DisplayPersonnelIncompatibility[]> {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Pour s'assurer que les données sont toujours fraîches
        });

        if (!response.ok) {
            // Tenter de lire le message d'erreur du corps de la réponse
            let errorMessage = `Erreur API: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                if (errorBody && errorBody.error) {
                    errorMessage = errorBody.error;
                }
            } catch (e: unknown) {
                // Ignorer si le corps n'est pas du JSON ou est vide
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error: unknown) {
        logger.error("Erreur lors de la récupération des incompatibilités via le service:", error instanceof Error ? error : new Error(String(error)));
        // Propager l'erreur pour que le composant appelant puisse la gérer (ex: afficher un message à l'utilisateur)
        throw error;
    }
}

// Les fonctions pour create, update, delete seront ajoutées ici plus tard
// export async function createPersonnelIncompatibility(data: unknown): Promise<DisplayPersonnelIncompatibility> { ... }
// export async function getPersonnelIncompatibilityById(id: string): Promise<DisplayPersonnelIncompatibility> { ... }
// export async function updatePersonnelIncompatibility(id: string, data: unknown): Promise<DisplayPersonnelIncompatibility> { ... }
// export async function deletePersonnelIncompatibility(id: string): Promise<void> { ... } 