import { logger } from "../../../lib/logger";

export interface PersonnelSpecialty {
    id: number | string; // L'ID de la spécialité peut aussi être une chaîne ou un nombre
    name: string;
}

export interface Personnel {
    id: string | number; // L'ID du personnel peut être nombre ou chaîne
    nom: string;
    prenom: string;
    role?: string;
    // Ancien champ: specialite?: string;
    specialties?: PersonnelSpecialty[]; // Nouveau champ pour un tableau de spécialités
    // Inclure d'autres champs vus dans les logs si nécessaire pour la complétude
    email?: string;
    phoneNumber?: string | null;
    status?: string;
    userId?: number | string | null;
    googleSheetName?: string;
}

export enum RolePersonnel {
    CHIRURGIEN = 'CHIRURGIEN',
    MAR = 'MAR',
    IADE = 'IADE'
}

export class PersonnelService {
    private static API_BASE_URL = '/api';

    /**
     * Récupère tous les chirurgiens
     */
    static async getChirurgiens(): Promise<Personnel[]> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/chirurgiens`, {
                credentials: 'include'
            });
            if (!response.ok) {
                logger.error(`Erreur API getChirurgiens: ${response.status} ${response.statusText}`);
                let errorBody = 'Réponse non JSON';
                try { errorBody = await response.text(); } catch (e) { }
                logger.error('Réponse API (Chirurgiens):', errorBody);
                throw new Error(`Erreur lors de la récupération des chirurgiens: ${response.status}`);
            }
            const data = await response.json();
            logger.info('[PersonnelService] Chirurgiens chargés depuis API:', data);
            return data;
        } catch (error) {
            logger.error("Erreur lors de la récupération des chirurgiens (catch global):", error);
            logger.info('[PersonnelService] Utilisation des mocks pour Chirurgiens.');
            return this.getMockChirurgiens();
        }
    }

    /**
     * Récupère tous les MARs (via /api/utilisateurs?role=MAR)
     */
    static async getMARs(): Promise<Personnel[]> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/utilisateurs?role=MAR`, {
                credentials: 'include'
            });
            if (!response.ok) {
                logger.error(`Erreur API getMARs: ${response.status} ${response.statusText}`);
                let errorBody = 'Réponse non JSON';
                try { errorBody = await response.text(); } catch (e) { }
                logger.error('Réponse API (MARs):', errorBody);
                throw new Error(`Erreur lors de la récupération des MARs: ${response.status}`);
            }
            const data = await response.json();
            logger.info('[PersonnelService] MARs chargés depuis API:', data);
            return data;
        } catch (error) {
            logger.error("Erreur lors de la récupération des MARs (catch global):", error);
            logger.info('[PersonnelService] Utilisation des mocks pour MARs.');
            return this.getMockMARs();
        }
    }

    /**
     * Récupère tous les IADEs (via /api/utilisateurs?role=IADE)
     */
    static async getIADEs(): Promise<Personnel[]> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/utilisateurs?role=IADE`, {
                credentials: 'include'
            });
            if (!response.ok) {
                logger.error(`Erreur API getIADEs: ${response.status} ${response.statusText}`);
                let errorBody = 'Réponse non JSON';
                try { errorBody = await response.text(); } catch (e) { }
                logger.error('Réponse API (IADEs):', errorBody);
                throw new Error(`Erreur lors de la récupération des IADEs: ${response.status}`);
            }
            const data = await response.json();
            logger.info('[PersonnelService] IADEs chargés depuis API:', data);
            return data;
        } catch (error) {
            logger.error("Erreur lors de la récupération des IADEs (catch global):", error);
            logger.info('[PersonnelService] Utilisation des mocks pour IADEs.');
            return this.getMockIADEs();
        }
    }

    /**
     * Données mockées pour les chirurgiens
     */
    private static getMockChirurgiens(): Personnel[] {
        return [
            { id: 'chir1', nom: 'Dupont', prenom: 'Jean', role: RolePersonnel.CHIRURGIEN, specialties: [{ id: 1, name: 'Cardiologie' }] },
            { id: 'chir2', nom: 'Martin', prenom: 'Alice', role: RolePersonnel.CHIRURGIEN, specialties: [{ id: 2, name: 'Orthopédie' }] },
            { id: 'chir3', nom: 'Bernard', prenom: 'Paul', role: RolePersonnel.CHIRURGIEN, specialties: [{ id: 3, name: 'Neurologie' }] },
            { id: 'chir4', nom: 'Vannier', prenom: 'Éloïse', role: RolePersonnel.CHIRURGIEN, specialties: [{ id: 4, name: 'Pédiatrie' }] },
            { id: 'chir-na', nom: 'N/A', prenom: '', role: RolePersonnel.CHIRURGIEN, specialties: [] } // Pas de spécialité pour N/A
        ];
    }

    /**
     * Données mockées pour les MARs
     */
    private static getMockMARs(): Personnel[] {
        return [
            { id: 'mar1', nom: 'Durand', prenom: 'Sophie', role: RolePersonnel.MAR },
            { id: 'mar2', nom: 'Leroy', prenom: 'Luc', role: RolePersonnel.MAR },
            { id: 'mar-na', nom: 'N/A', prenom: '', role: RolePersonnel.MAR }
        ];
    }

    /**
     * Données mockées pour les IADEs
     */
    private static getMockIADEs(): Personnel[] {
        return [
            { id: 'iade1', nom: 'Petit', prenom: 'Marc', role: RolePersonnel.IADE },
            { id: 'iade2', nom: 'Moreau', prenom: 'Eva', role: RolePersonnel.IADE },
            { id: 'iade-na', nom: 'N/A', prenom: '', role: RolePersonnel.IADE }
        ];
    }
} 