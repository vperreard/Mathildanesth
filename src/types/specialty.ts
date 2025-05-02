/**
 * Énumération des spécialités d'anesthésie
 * Pour une utilisation cohérente dans toute l'application
 */
export enum Specialty {
    // Spécialités principales
    ANESTHESIE = 'Anesthésie',
    REANIMATION = 'Réanimation',
    URGENCES = 'Urgences',

    // Spécialités secondaires/spécifiques
    ANESTHESIE_PEDIATRIQUE = 'Anesthésie Pédiatrique',
    ANESTHESIE_OBSTETRICALE = 'Anesthésie Obstétricale',
    ANESTHESIE_CARDIAQUE = 'Anesthésie Cardiaque',
    ANESTHESIE_NEUROCHIRURGICALE = 'Anesthésie Neurochirurgicale',
    ANESTHESIE_AMBULATOIRE = 'Anesthésie Ambulatoire',
    DOULEUR = 'Traitement de la Douleur',

    // Spécialités complémentaires
    SOINS_INTENSIFS = 'Soins Intensifs',
    BLOC_OPERATOIRE = 'Bloc Opératoire',
    CONSULTATION = 'Consultation d\'Anesthésie',
}

/**
 * Map des spécialités par groupe pour la catégorisation
 */
export const SpecialtyGroups = {
    PRINCIPALES: [
        Specialty.ANESTHESIE,
        Specialty.REANIMATION,
        Specialty.URGENCES
    ],
    SPECIFIQUES: [
        Specialty.ANESTHESIE_PEDIATRIQUE,
        Specialty.ANESTHESIE_OBSTETRICALE,
        Specialty.ANESTHESIE_CARDIAQUE,
        Specialty.ANESTHESIE_NEUROCHIRURGICALE,
        Specialty.ANESTHESIE_AMBULATOIRE,
        Specialty.DOULEUR
    ],
    COMPLEMENTAIRES: [
        Specialty.SOINS_INTENSIFS,
        Specialty.BLOC_OPERATOIRE,
        Specialty.CONSULTATION
    ]
};

/**
 * Retourne toutes les spécialités d'un utilisateur selon son profil
 * @param isReanimator - Si l'utilisateur est réanimateur
 * @param isPediatrician - Si l'utilisateur est pédiatre
 * @returns Tableau des spécialités applicables
 */
export function getUserSpecialties(isReanimator: boolean = false, isPediatrician: boolean = false): Specialty[] {
    const specialties: Specialty[] = [Specialty.ANESTHESIE];

    if (isReanimator) {
        specialties.push(Specialty.REANIMATION);
        specialties.push(Specialty.SOINS_INTENSIFS);
    }

    if (isPediatrician) {
        specialties.push(Specialty.ANESTHESIE_PEDIATRIQUE);
    }

    return specialties;
} 