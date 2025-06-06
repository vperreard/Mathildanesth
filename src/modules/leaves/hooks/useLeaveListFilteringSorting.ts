import { useMemo } from 'react';
import { logger } from "../../../lib/logger";
import { LeaveWithUser, LeaveType, LeaveStatus } from '../types/leave';

// Helper function (peut aussi être dans un fichier utils/dates)
const formatDateForInput = (dateString: string | Date | undefined): string => {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) {
            return '';
        }
        // Correction: Utiliser getFullYear, getMonth, getDate pour éviter les problèmes de fuseau horaire
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mois est 0-indexé
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e: unknown) {
        logger.error("Erreur de formatage de date pour input:", e);
        return '';
    }
};

// 🔧 CORRECTION @TS-IGNORE : Helper typé pour l'accès aux noms d'utilisateur
const getUserDisplayName = (user: unknown): string => {
    if (!user) return '';

    // Support de la double structure de nommage de façon typée
    const firstName = (user.firstName || user.prenom || '') as string;
    const lastName = (user.lastName || user.nom || '') as string;

    return `${firstName} ${lastName}`.trim();
};

// 🔧 CORRECTION @TS-IGNORE : Helper typé pour l'accès aux propriétés dynamiques
const getLeaveProperty = (leave: LeaveWithUser, field: string): string => {
    // Accès typé avec vérification des propriétés existantes
    const typedLeave = leave as any;
    return typedLeave[field]?.toString() || '';
};

// Types nécessaires pour le tri et le filtre
// Ce type pourrait être partagé s'il est utilisé ailleurs
export type SortableFilterableKeys = keyof LeaveWithUser | 'user' | 'type' | 'startDate' | 'endDate' | 'status';
export type SortDirection = 'asc' | 'desc';
export type FilterValues = Partial<Record<SortableFilterableKeys, string>>;
export type SortState = { field: SortableFilterableKeys; direction: SortDirection };

interface UseLeaveListFilteringSortingProps {
    leaves: LeaveWithUser[];
    filter: FilterValues;
    sort: SortState;
}

export const useLeaveListFilteringSorting = ({
    leaves,
    filter,
    sort,
}: UseLeaveListFilteringSortingProps): LeaveWithUser[] => {

    const sortedLeaves = useMemo(() => {
        if (!Array.isArray(leaves)) {
            logger.warn("useLeaveListFilteringSorting: 'leaves' n'est pas un tableau.");
            return [];
        }
        const sorted = [...leaves].sort((a, b) => {
            const field = sort.field;
            let aValue: string | number | Date | null = null;
            let bValue: string | number | Date | null = null;

            try {
                if (field === 'user') {
                    // 🔧 PLUS DE @ts-expect-error : Utilisation de la fonction helper typée
                    aValue = getUserDisplayName(a.user).toLowerCase();
                    bValue = getUserDisplayName(b.user).toLowerCase();
                } else if (field === 'startDate' || field === 'endDate') {
                    aValue = a[field] ? new Date(a[field]) : null;
                    bValue = b[field] ? new Date(b[field]) : null;
                    if (aValue && isNaN(aValue.getTime())) aValue = null;
                    if (bValue && isNaN(bValue.getTime())) bValue = null;

                    if (aValue === null && bValue === null) return 0;
                    if (aValue === null) return sort.direction === 'asc' ? 1 : -1;
                    if (bValue === null) return sort.direction === 'asc' ? -1 : 1;
                    // Comparaison directe des objets Date
                    const comparison = aValue.getTime() - bValue.getTime();
                    return sort.direction === 'asc' ? comparison : -comparison;
                } else if (field === 'type' || field === 'status') {
                    // Utilisation des enums LeaveType/LeaveStatus
                    aValue = a[field]?.toString().toLowerCase() ?? '';
                    bValue = b[field]?.toString().toLowerCase() ?? '';
                } else {
                    // 🔧 PLUS DE @ts-expect-error : Utilisation de la fonction helper typée
                    aValue = getLeaveProperty(a, field as string).toLowerCase();
                    bValue = getLeaveProperty(b, field as string).toLowerCase();
                }
            } catch (e: unknown) {
                logger.error(`Erreur durant la récupération des valeurs pour le tri sur le champ ${String(field)}:`, e);
                return 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sort.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }

            return 0;
        });
        return sorted;
    }, [leaves, sort]);

    const filteredAndSortedLeaves = useMemo(() => {
        return sortedLeaves.filter(leave => {
            // Utiliser Object.entries pour avoir la clé et la valeur
            return Object.entries(filter).every(([key, filterValue]) => {
                // Vérifier si la clé est valide et si une valeur de filtre existe
                if (!filterValue || !isValidSortableFilterableKey(key)) return true;

                const cleanFilterValue = filterValue.trim().toLowerCase();
                if (!cleanFilterValue) return true; // Pas de filtre si valeur vide après nettoyage

                let leaveValue: string = '';
                try {
                    if (key === 'user') {
                        // 🔧 PLUS DE @ts-expect-error : Utilisation de la fonction helper typée
                        leaveValue = getUserDisplayName(leave.user).toLowerCase();
                    } else if (key === 'startDate' || key === 'endDate') {
                        const date = leave[key];
                        if (date) {
                            const formattedDateForFilter = formatDateForInput(date);
                            return formattedDateForFilter === cleanFilterValue;
                        }
                        return false;
                    } else if (key === 'type' || key === 'status') {
                        leaveValue = leave[key]?.toString().toLowerCase() ?? '';
                    } else if (key === 'reason') { // Ajouter explicitement les autres clés filtrables
                        leaveValue = leave[key]?.toString().toLowerCase() ?? '';
                    }
                    else {
                        // Ignorer les clés non gérées explicitement pour le filtrage
                        return true;
                    }
                } catch (e: unknown) {
                    logger.error(`Erreur durant le filtrage sur le champ ${String(key)}:`, e);
                    return false;
                }

                // Filtrage par inclusion pour les clés textuelles gérées
                if (key === 'user' || key === 'type' || key === 'status' || key === 'reason') {
                    return leaveValue.includes(cleanFilterValue);
                }

                // Si on arrive ici, c'est que la comparaison de date ( === ) a réussi avant
                return true;
            });
        });
    }, [sortedLeaves, filter]);

    return filteredAndSortedLeaves;
};

// Helper pour vérifier si une clé est valide (évite le cast risqué)
const validKeys: ReadonlyArray<SortableFilterableKeys> = ['id', 'userId', 'startDate', 'endDate', 'type', 'status', 'countedDays', 'reason', 'comment', 'requestDate', 'createdAt', 'updatedAt', 'user'];
function isValidSortableFilterableKey(key: string): key is SortableFilterableKeys {
    return validKeys.includes(key as SortableFilterableKeys);
} 