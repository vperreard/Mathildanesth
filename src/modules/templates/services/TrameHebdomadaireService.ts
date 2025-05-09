import { TypeSemaine, JourSemaine, PeriodeJour } from "@/app/parametres/trames/EditeurTramesHebdomadaires";

export interface AffectationTrameDTO {
    id: string;
    jourSemaine: JourSemaine;
    periode: PeriodeJour;
    salleId?: string | null;
    chirurgienId?: string | null;
    marId?: string | null;
    iadeId?: string | null;
}

export interface TrameHebdomadaireDTO {
    id: string;
    nom: string;
    typeSemaine: TypeSemaine;
    description?: string;
    affectations: AffectationTrameDTO[];
}

export class TrameHebdomadaireService {
    private static API_BASE_URL = '/api/trames';

    /**
     * Récupère toutes les trames hebdomadaires
     */
    static async getAllTrames(): Promise<TrameHebdomadaireDTO[]> {
        try {
            const response = await fetch(`${this.API_BASE_URL}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des trames: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Erreur lors de la récupération des trames:", error);
            // Pour le développement initial, retourner des données mockées
            return this.getMockTrames();
        }
    }

    /**
     * Récupère une trame spécifique par son ID
     */
    static async getTrameById(id: string): Promise<TrameHebdomadaireDTO> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/${id}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération de la trame: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de la récupération de la trame ${id}:`, error);
            // Pour le développement initial, retourner une donnée mockée
            return this.getMockTrames().find(t => t.id === id) || this.getMockTrames()[0];
        }
    }

    /**
     * Crée une nouvelle trame
     */
    static async createTrame(trame: Omit<TrameHebdomadaireDTO, 'id'>): Promise<TrameHebdomadaireDTO> {
        try {
            const response = await fetch(`${this.API_BASE_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trame),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la création de la trame: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Erreur lors de la création de la trame:", error);
            // Pour le développement initial, simuler un succès avec un nouvel ID
            return {
                ...trame,
                id: `new-trame-${Date.now()}`
            };
        }
    }

    /**
     * Met à jour une trame existante
     */
    static async updateTrame(id: string, trame: TrameHebdomadaireDTO): Promise<TrameHebdomadaireDTO> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trame),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la mise à jour de la trame: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la trame ${id}:`, error);
            // Pour le développement initial, retourner la trame mise à jour telle quelle
            return trame;
        }
    }

    /**
     * Supprime une trame
     */
    static async deleteTrame(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Erreur lors de la suppression de la trame: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression de la trame ${id}:`, error);
            // Pour le développement initial, simuler un succès
            return true;
        }
    }

    /**
     * Données mockées pour le développement
     * Utilisées en fallback si l'API n'est pas disponible
     */
    private static getMockTrames(): TrameHebdomadaireDTO[] {
        return [
            {
                id: 'trame-paires-std',
                nom: 'Standard Semaines PAIRES',
                typeSemaine: TypeSemaine.PAIRE,
                description: 'Configuration type pour les semaines paires',
                affectations: [
                    { id: 'aff-p1', jourSemaine: JourSemaine.LUNDI, periode: PeriodeJour.MATIN, salleId: 'salle1', chirurgienId: 'chir1', marId: 'mar1', iadeId: 'iade1' },
                    { id: 'aff-p2', jourSemaine: JourSemaine.MARDI, periode: PeriodeJour.APRES_MIDI, salleId: 'salle2', chirurgienId: 'chir2', marId: 'mar1' },
                ]
            },
            {
                id: 'trame-impaires-cardio',
                nom: 'Cardio Semaines IMPAIRES',
                typeSemaine: TypeSemaine.IMPAIRE,
                description: 'Rotation cardio pour les semaines impaires',
                affectations: [
                    { id: 'aff-i1', jourSemaine: JourSemaine.MERCREDI, periode: PeriodeJour.MATIN, salleId: 'salle1', chirurgienId: 'chir3', iadeId: 'iade2' },
                    { id: 'aff-i3', jourSemaine: JourSemaine.VENDREDI, periode: PeriodeJour.MATIN, salleId: 'salle3', chirurgienId: 'chir1' },
                    { id: 'aff-i4', jourSemaine: JourSemaine.VENDREDI, periode: PeriodeJour.APRES_MIDI, salleId: 'salle3', chirurgienId: 'chir1', marId: 'mar2', iadeId: 'iade1' },
                ]
            }
        ];
    }
} 