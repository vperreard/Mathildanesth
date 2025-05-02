import { Assignment, Room, User, UserRole, Shift } from './types';

// Fonction pour générer des utilisateurs mock
export function getMockUsers(): User[] {
    return [
        { id: 1, nom: 'Dupont', prenom: 'Jean', role: 'MAR', lastName: 'Dupont', firstName: 'Jean' },
        { id: 2, nom: 'Martin', prenom: 'Sophie', role: 'IADE', lastName: 'Martin', firstName: 'Sophie' },
        { id: 3, nom: 'Bernard', prenom: 'Luc', role: 'MAR', lastName: 'Bernard', firstName: 'Luc' },
        { id: 4, nom: 'Petit', prenom: 'Alice', role: 'IADE', lastName: 'Petit', firstName: 'Alice' },
        // Note: 'SURGEON' n'est pas inclus ici car les chirurgiens sont gérés séparément ou non pertinents pour ces affectations mock.
    ];
}

// Fonction pour générer des salles mock
export function getMockRooms(): Room[] {
    return [
        { id: 'salle1', name: 'Salle Op 1', sector: 'Bloc A' },
        { id: 'salle2', name: 'Salle Op 2', sector: 'Bloc A' },
        { id: 'salle3', name: 'Salle Op 3', sector: 'Bloc B' },
        { id: 'salle4', name: 'Salle Op 4', sector: 'Bloc B' },
    ];
}

// Fonction pour générer des affectations mock pour une semaine
export function getMockAssignments(users: User[], rooms: Room[]): Assignment[] {
    const assignments: Assignment[] = [];
    const startDate = new Date(); // Commence aujourd'hui
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Aller au lundi de cette semaine

    for (let day = 0; day < 5; day++) { // Lundi à Vendredi
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        const dateString = currentDate.toISOString().split('T')[0]; // Format YYYY-MM-DD

        const shifts: Shift[] = ['matin', 'apresmidi'];

        shifts.forEach(shift => {
            rooms.forEach((room, roomIndex) => {
                // Affecter un utilisateur différent à chaque salle/shift pour varier
                const userIndex = (day * shifts.length * rooms.length + (shift === 'matin' ? 0 : 1) * rooms.length + roomIndex) % users.length;
                const user = users[userIndex];

                assignments.push({
                    id: `${dateString}-${shift}-${room.id}-${user.id}`,
                    roomId: room.id,
                    userId: user.id, // Utiliser userId au lieu de personnelId
                    surgeonId: null, // Supposons pas de chirurgien pour ces mocks simples
                    date: dateString,
                    shift: shift,
                    notes: `Note pour ${user.prenom} en ${room.name} le ${dateString} (${shift})`,
                    // status: 'Confirmé', // Removed optional status
                    // Les champs optionnels comme isNew, isModified, hasConflict peuvent être ajoutés si nécessaire
                    // Les champs de compatibilité marId/iadeId pourraient être remplis ici si besoin
                    marId: user.role === 'MAR' ? user.id : null,
                    iadeId: user.role === 'IADE' ? user.id : null,
                    // period est pour compatibilité, la logique principale utilise shift
                });
            });
        });
    }

    return assignments;
}

// Exporter les données générées
export const mockUsers = getMockUsers();
export const mockRooms = getMockRooms();
export const mockAssignments = getMockAssignments(mockUsers, mockRooms); 