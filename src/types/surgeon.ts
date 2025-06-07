// src/types/surgeon.ts

// Interface pour les données d'un chirurgien (peut être enrichie)
export interface Surgeon {
    id: number;
    nom: string;
    prenom: string;
    specialties: string[]; // Stocké comme tableau en BDD
    status: string; // Ex: 'ACTIF', 'INACTIF'
    userId?: number | null; // ID de l'utilisateur lié (optionnel)
    sites?: Array<{
        id: string;
        name: string;
    }>; // Sites assignés au chirurgien
}

// Interface pour les données du formulaire Chirurgien
// On utilise une chaîne pour les spécialités pour la saisie
export type SurgeonFormData = Omit<Surgeon, 'id' | 'specialties'> & {
    specialties: string; // Saisie comme chaîne, ex: "Ortho, Cardio"
}; 