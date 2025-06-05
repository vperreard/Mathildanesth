import { Attribution, Room, User, UserRole, Shift } from './types';

import { logger } from "../../../lib/logger";
// Fonction pour générer des utilisateurs mock
export function getMockUsers(): User[] {
    return [
        { id: 1, nom: 'Dupont', prenom: 'Jean', role: 'MAR', lastName: 'Dupont', firstName: 'Jean', specialty: 'Anesthésie générale' },
        { id: 2, nom: 'Martin', prenom: 'Sophie', role: 'IADE', lastName: 'Martin', firstName: 'Sophie', specialty: '' },
        { id: 3, nom: 'Bernard', prenom: 'Luc', role: 'MAR', lastName: 'Bernard', firstName: 'Luc', specialty: 'Anesthésie pédiatrique' },
        { id: 4, nom: 'Petit', prenom: 'Alice', role: 'IADE', lastName: 'Petit', firstName: 'Alice', specialty: '' },
        { id: 5, nom: 'Dubois', prenom: 'Marc', role: 'MAR', lastName: 'Dubois', firstName: 'Marc', specialty: 'Anesthésie cardiaque' },
        { id: 6, nom: 'Leroy', prenom: 'Emma', role: 'IADE', lastName: 'Leroy', firstName: 'Emma', specialty: '' },
        { id: 7, nom: 'Moreau', prenom: 'Thomas', role: 'MAR', lastName: 'Moreau', firstName: 'Thomas', specialty: 'Anesthésie ambulatoire' },
        { id: 8, nom: 'Laurent', prenom: 'Julie', role: 'IADE', lastName: 'Laurent', firstName: 'Julie', specialty: '' },
        { id: 9, nom: 'Garcia', prenom: 'Antoine', role: 'SURGEON', lastName: 'Garcia', firstName: 'Antoine', specialty: 'Orthopédie' },
        { id: 10, nom: 'Roux', prenom: 'Camille', role: 'SURGEON', lastName: 'Roux', firstName: 'Camille', specialty: 'Cardiologie' },
        { id: 11, nom: 'Faure', prenom: 'Nicolas', role: 'SURGEON', lastName: 'Faure', firstName: 'Nicolas', specialty: 'Ophtalmologie' },
        { id: 12, nom: 'Simon', prenom: 'Aurélie', role: 'SURGEON', lastName: 'Simon', firstName: 'Aurélie', specialty: 'Neurochirurgie' },
        { id: 13, nom: 'Michel', prenom: 'Paul', role: 'SURGEON', lastName: 'Michel', firstName: 'Paul', specialty: 'Digestif' },
        { id: 14, nom: 'Lefebvre', prenom: 'Cécile', role: 'SURGEON', lastName: 'Lefebvre', firstName: 'Cécile', specialty: 'Urologie' },
        { id: 15, nom: 'Blanc', prenom: 'Olivier', role: 'SURGEON', lastName: 'Blanc', firstName: 'Olivier', specialty: 'Gynécologie' },
        { id: 16, nom: 'Girard', prenom: 'Stéphanie', role: 'SURGEON', lastName: 'Girard', firstName: 'Stéphanie', specialty: 'Pédiatrie' },
    ];
}

// Fonction pour générer des salles mock
export function getMockRooms(): Room[] {
    // Cette fonction est maintenant remplacée par fetchRooms() qui utilise l'API
    // On conserve cette implémentation comme fallback
    return [
        // Secteur Hyperaseptique
        { id: 'salle1', name: 'Salle H1', sector: 'Hyperaseptique', order: 1 },
        { id: 'salle2', name: 'Salle H2', sector: 'Hyperaseptique', order: 2 },
        { id: 'salle3', name: 'Salle H3', sector: 'Hyperaseptique', order: 3 },

        // Secteur Orthopédie
        { id: 'salle4', name: 'Salle O1', sector: 'Orthopédie', order: 4 },
        { id: 'salle5', name: 'Salle O2', sector: 'Orthopédie', order: 5 },

        // Secteur Viscéral
        { id: 'salle6', name: 'Salle V1', sector: 'Viscéral', order: 6 },
        { id: 'salle7', name: 'Salle V2', sector: 'Viscéral', order: 7 },
        { id: 'salle8', name: 'Salle V3', sector: 'Viscéral', order: 8 },

        // Secteur Ambulatoire
        { id: 'salle9', name: 'Salle A1', sector: 'Ambulatoire', order: 9 },
        { id: 'salle10', name: 'Salle A2', sector: 'Ambulatoire', order: 10 },

        // Secteur Ophtalmologie
        { id: 'salle11', name: 'Salle OP1', sector: 'Ophtalmologie', order: 11 },
        { id: 'salle12', name: 'Salle OP2', sector: 'Ophtalmologie', order: 12 },
    ];
}

// Nouvelle fonction qui récupère les salles depuis l'API
export async function fetchRooms(): Promise<Room[]> {
    try {
        const response = await fetch('http://localhost:3000/api/operating-rooms');

        if (!response.ok) {
            logger.error('Erreur lors de la récupération des salles depuis l\'API:', response.statusText);
            // En cas d'erreur, retourner les salles mock
            return getMockRooms();
        }

        const apiRooms = await response.json();

        // Transformer les données API au format attendu par l'application
        return apiRooms.map((room: unknown, index: number) => ({
            id: room.id,
            name: room.name,
            number: room.number,
            sector: typeof room.sector === 'object' && room.sector !== null ? room.sector.name : (room.sector || 'Non défini'),
            colorCode: room.colorCode,
            order: index, // Ordre par défaut basé sur l'ordre de l'API
            isActive: room.isActive !== undefined ? room.isActive : true
        }));
    } catch (error: unknown) {
        logger.error('Erreur lors de la récupération des salles:', error instanceof Error ? error : new Error(String(error)));
        // En cas d'erreur, retourner les salles mock
        return getMockRooms();
    }
}

// Fonction pour générer des affectations mock
export function getMockAssignments(): Attribution[] {
    const users = getMockUsers();
    const rooms = getMockRooms();
    const surgeons = users.filter(u => u.role === 'SURGEON');
    const mars = users.filter(u => u.role === 'MAR');
    const iades = users.filter(u => u.role === 'IADE');

    const attributions: Attribution[] = [];
    const startDate = new Date(); // Commence aujourd'hui
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Aller au lundi de cette semaine

    for (let day = 0; day < 5; day++) { // Lundi à Vendredi
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);

        rooms.forEach((room, roomIndex) => {
            // Indice pour varier les assignations
            const surgeonIndex = (roomIndex + day) % surgeons.length;
            const marIndex = (roomIndex + day) % mars.length;
            const iadeIndex = (roomIndex + day) % iades.length;

            // Assignation du matin
            attributions.push({
                id: `${currentDate.toISOString()}-${room.id}-morning`,
                roomId: room.id,
                userId: surgeons[surgeonIndex].id, // Pour compatibilité
                surgeonId: surgeons[surgeonIndex].id,
                marId: mars[marIndex].id,
                iadeId: iades[iadeIndex].id,
                date: currentDate.toISOString(),
                shift: 'matin',
                period: 'MORNING', // Pour compatibilité
                notes: `Opération en ${room.name} (${room.sector}) - Matin`
            });

            // Assignation de l'après-midi (pas dans toutes les salles)
            if (Math.random() > 0.3) { // 70% de chance d'avoir une assignation l'après-midi
                attributions.push({
                    id: `${currentDate.toISOString()}-${room.id}-afternoon`,
                    roomId: room.id,
                    userId: surgeons[(surgeonIndex + 1) % surgeons.length].id, // Utiliser un chirurgien différent
                    surgeonId: surgeons[(surgeonIndex + 1) % surgeons.length].id,
                    marId: mars[(marIndex + 1) % mars.length].id,
                    iadeId: iades[(iadeIndex + 1) % iades.length].id,
                    date: currentDate.toISOString(),
                    shift: 'apresmidi',
                    period: 'AFTERNOON', // Pour compatibilité
                    notes: `Opération en ${room.name} (${room.sector}) - Après-midi`
                });
            }
        });
    }

    return attributions;
}

export const mockUsers = getMockUsers();
export const mockRooms = getMockRooms();
export const mockAssignments = getMockAssignments(); 