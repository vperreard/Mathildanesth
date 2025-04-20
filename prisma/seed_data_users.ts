// --- Données pour les utilisateurs à créer ---
// Remarques :
// - Le mot de passe sera haché automatiquement dans le script seed.ts.
// - Les dates peuvent être des objets Date() ou des chaînes ISO (ex: '2024-01-15T00:00:00Z').
// - Les champs optionnels (phoneNumber, etc.) peuvent être omis ou mis à null.
// - Utilisez les vraies valeurs des enums Role et ProfessionalRole.

// Importez les enums nécessaires (sera fait dans le vrai seed.ts)
// import { Role, ProfessionalRole } from '@prisma/client';

// Temporairement, on peut définir des types "faux" pour que TypeScript ne se plaigne pas ici
type Role = 'ADMIN_TOTAL' | 'ADMIN_PARTIEL' | 'USER';
type ProfessionalRole = 'MAR' | 'IADE' | 'SECRETAIRE';

export const seedUsers = [
    {
        nom: 'Durand',
        prenom: 'Marie',
        login: 'mdurand',
        email: 'marie.durand@example.com',
        phoneNumber: '0611223344',
        password: 'password123', // Sera haché
        role: 'USER' as Role,
        professionalRole: 'MAR' as ProfessionalRole,
        tempsPartiel: false,
        pourcentageTempsPartiel: null,
        joursTravailles: 'LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI',
        dateEntree: new Date('2023-05-10'),
        dateSortie: null,
        actif: true,
        mustChangePassword: true, // Force le changement au premier login
    },
    {
        nom: 'Petit',
        prenom: 'Jean',
        login: 'jpetit',
        email: 'jean.petit@example.com',
        phoneNumber: null,
        password: 'password456', // Sera haché
        role: 'USER' as Role,
        professionalRole: 'IADE' as ProfessionalRole,
        tempsPartiel: true,
        pourcentageTempsPartiel: 80.0,
        joursTravailles: 'LUNDI,MARDI,JEUDI,VENDREDI',
        dateEntree: new Date('2022-11-01'),
        dateSortie: null,
        actif: true,
        mustChangePassword: false,
    },
    // --- Ajoutez d'autres utilisateurs ici ---
    // Exemple:
    // {
    //   nom: 'Martin',
    //   prenom: 'Sophie',
    //   login: 'smartin',
    //   email: 'sophie.martin@example.com',
    //   phoneNumber: null,
    //   password: 'password789',
    //   role: 'ADMIN_PARTIEL' as Role,
    //   professionalRole: 'SECRETAIRE' as ProfessionalRole,
    //   tempsPartiel: false,
    //   pourcentageTempsPartiel: null,
    //   joursTravailles: null,
    //   dateEntree: new Date('2024-01-02'),
    //   dateSortie: null,
    //   actif: true,
    //   mustChangePassword: true,
    // },
]; 