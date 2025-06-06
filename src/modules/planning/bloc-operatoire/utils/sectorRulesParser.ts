import { JsonValue } from '@prisma/client/runtime/library';

/**
 * Interface définissant la structure attendue des règles de secteur
 */
export interface SectorRuleProperties {
    requireContiguousRooms?: boolean;
    minIADEPerRoom?: number;
    maxRoomsPerSupervisor?: number;
    contiguityMap?: Record<string, string[]>;
}

/**
 * Parse les règles de secteur stockées en JSON et retourne un objet typé
 * @param rules - La valeur JSON des règles de secteur
 * @returns Un objet typé contenant les règles de secteur
 */
export function getSectorRules(rules: JsonValue | null | undefined): SectorRuleProperties {
    // Si rules est null, undefined, ou pas un objet, retourner un objet vide
    if (!rules || typeof rules !== 'object' || Array.isArray(rules)) {
        return {};
    }

    const result: SectorRuleProperties = {};

    // Cast sûr après vérification du type
    const rulesObj = rules as Record<string, unknown>;

    // Extraction de requireContiguousRooms (boolean)
    if (typeof rulesObj.requireContiguousRooms === 'boolean') {
        result.requireContiguousRooms = rulesObj.requireContiguousRooms;
    }

    // Extraction de minIADEPerRoom (number)
    if (typeof rulesObj.minIADEPerRoom === 'number' && Number.isInteger(rulesObj.minIADEPerRoom)) {
        result.minIADEPerRoom = rulesObj.minIADEPerRoom;
    }

    // Extraction de maxRoomsPerSupervisor (number)
    if (typeof rulesObj.maxRoomsPerSupervisor === 'number' && Number.isInteger(rulesObj.maxRoomsPerSupervisor)) {
        result.maxRoomsPerSupervisor = rulesObj.maxRoomsPerSupervisor;
    }

    // Extraction de contiguityMap (Record<string, string[]>)
    if (rulesObj.contiguityMap && typeof rulesObj.contiguityMap === 'object') {
        result.contiguityMap = {};
        for (const [key, value] of Object.entries(rulesObj.contiguityMap)) {
            if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
                result.contiguityMap[key] = value;
            }
        }
    }

    return result;
}

/**
 * Vérifie si un ensemble de salles sont contiguës selon la carte de contiguïté en utilisant BFS
 * @param roomIds - Liste des identifiants de salles
 * @param contiguityMap - Carte de contiguïté
 * @returns true si les salles sont contiguës, false sinon
 */
export function areRoomsContiguous(
    roomIds: string[],
    contiguityMap?: Record<string, string[]>
): boolean {
    // Si pas de carte de contiguïté ou une seule salle, retourner true
    if (!contiguityMap || roomIds.length <= 1) return true;

    // Cas spécial pour deux salles
    if (roomIds.length === 2) {
        // Vérification directe pour le cas de deux salles
        const [room1, room2] = roomIds;
        // Vérifier la connectivité directe
        if ((contiguityMap[room1] && contiguityMap[room1].includes(room2)) ||
            (contiguityMap[room2] && contiguityMap[room2].includes(room1))) {
            return true;
        }

        // Si pas de connexion directe, vérifier la connectivité à travers des salles intermédiaires
        const visited = new Set<string>([room1]);
        const queue = [room1];

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (current === room2) return true;

            const neighbors = contiguityMap[current] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        return false;
    }

    // Pour plus de 2 salles, vérifier si toutes les salles forment un graphe connecté
    const visited = new Set<string>();
    const queue = [roomIds[0]];
    visited.add(roomIds[0]);

    while (queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = contiguityMap[current] || [];

        for (const neighbor of neighbors) {
            if (roomIds.includes(neighbor) && !visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }

    // Toutes les salles demandées doivent être visitées
    return roomIds.every(id => visited.has(id));
}

/**
 * Type pour les salles avec un identifiant et un numéro
 */
type Room = {
    id: number;
    number: string;
};

/**
 * Vérifie si toutes les salles sont connectées en se basant sur leur numéro
 * @param rooms - Liste des salles à vérifier
 * @returns true si toutes les salles sont connectées, false sinon
 */
export function areAllRoomsConnected(
    rooms: Room[]
): boolean {
    if (rooms.length <= 1) return true;

    // Extraire et trier les numéros des salles
    const roomNumbers = rooms.map(room => room.number).sort();

    // Vérifier si tous les numéros sont des nombres ou des caractères consécutifs
    const allNumeric = roomNumbers.every(num => !isNaN(Number(num)));

    if (allNumeric) {
        // Convertir en nombres et trier
        const numericRoomNumbers = roomNumbers.map(num => parseInt(num, 10)).sort((a, b) => a - b);

        // Vérifier si la séquence est continue
        for (let i = 1; i < numericRoomNumbers.length; i++) {
            if (numericRoomNumbers[i] !== numericRoomNumbers[i - 1] + 1) {
                return false;
            }
        }
        return true;
    } else {
        // Vérifier si tous les caractères sont consécutifs
        const allAlphabetic = roomNumbers.every(num => /^[A-Za-z]$/.test(num));

        if (allAlphabetic) {
            const alphabeticRoomNumbers = roomNumbers.map(num => num.toUpperCase().charCodeAt(0)).sort((a, b) => a - b);

            // Vérifier si la séquence alphabétique est continue
            for (let i = 1; i < alphabeticRoomNumbers.length; i++) {
                if (alphabeticRoomNumbers[i] !== alphabeticRoomNumbers[i - 1] + 1) {
                    return false;
                }
            }
            return true;
        }

        // Si on a un mélange de caractères alphabétiques et numériques, retourner false
        return false;
    }
} 