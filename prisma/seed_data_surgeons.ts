// --- Données pour les chirurgiens à créer ---
// Remarques :
// - specialtyNames: Liste des noms des spécialités. Le script seed.ts cherchera les IDs correspondants.
//   Assurez-vous que les noms correspondent EXACTEMENT à ceux créés dans la partie "specialties" du seed.
// - userId: Si vous voulez lier un chirurgien à un utilisateur créé ci-dessus, on devra ajouter une logique
//   dans seed.ts pour trouver l'ID de l'utilisateur (par ex. via son email/login). Pour l'instant, on laisse null.
// - Utilisez les vraies valeurs de l'enum UserStatus.

// Importez les enums nécessaires (sera fait dans le vrai seed.ts)
// import { UserStatus } from '@prisma/client';

// Type "faux" temporaire
type UserStatus = 'ACTIF' | 'INACTIF';

export const seedSurgeons = [
    {
        nom: 'Bernard',
        prenom: 'Lucie',
        email: 'lucie.bernard@chir.example.com',
        phoneNumber: '0699887766',
        status: 'ACTIF' as UserStatus,
        userId: null, // Pourrait être lié plus tard par email/login
        specialtyNames: ['Orthopédie', 'Orthopédie pédiatrique'], // Noms des spécialités
    },
    {
        nom: 'Moreau',
        prenom: 'Pierre',
        email: 'pierre.moreau@chir.example.com',
        phoneNumber: null,
        status: 'ACTIF' as UserStatus,
        userId: null,
        specialtyNames: ['Chirurgie ORL'],
    },
    {
        nom: 'Garcia',
        prenom: 'Isabelle',
        email: 'isabelle.garcia@chir.example.com',
        phoneNumber: '0612345678',
        status: 'INACTIF' as UserStatus, // Exemple d'un chirurgien inactif
        userId: null,
        specialtyNames: ['Chirurgie plastique', 'Chirurgie gynécologique'],
    },
    // --- Ajoutez d'autres chirurgiens ici ---
    // Exemple:
    // {
    //   nom: 'Dubois',
    //   prenom: 'Antoine',
    //   email: 'antoine.dubois@chir.example.com',
    //   phoneNumber: null,
    //   status: 'ACTIF' as UserStatus,
    //   userId: null, // Pourrait être lié à l'utilisateur 'adubois' si on crée ce login
    //   specialtyNames: ['Chirurgie digestive', 'Endoscopie interventionnelle'],
    // },
]; 