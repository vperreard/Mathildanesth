import { useMemo } from 'react';
import { LeaveWithUser, LeaveType, LeaveStatus } from '../types/leave';

// Helper function (peut aussi être dans un fichier utils/dates)
const formatDateForInput = (dateString: string | Date | undefined): string => {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch (e) {
        console.error("Erreur de formatage de date pour input:", e);
        return '';
    }
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
            console.warn("useLeaveListFilteringSorting: 'leaves' n'est pas un tableau.");
            return [];
        }
        const sorted = [...leaves].sort((a, b) => {
            const field = sort.field;
            let aValue: string | number | Date | null = null;
            let bValue: string | number | Date | null = null;

            try {
                if (field === 'user') {
                    // @ts-ignore - Support de la double structure de nommage (à vérifier si encore pertinent)
                    const aFirstName = a.user?.firstName || a.user?.prenom || '';
                    // @ts-ignore
                    const aLastName = a.user?.lastName || a.user?.nom || '';
                    // @ts-ignore
                    const bFirstName = b.user?.firstName || b.user?.prenom || '';
                    // @ts-ignore
                    const bLastName = b.user?.lastName || b.user?.nom || '';

                    aValue = `${aFirstName} ${aLastName}`.trim().toLowerCase();
                    bValue = `${bFirstName} ${bLastName}`.trim().toLowerCase();
                } else if (field === 'startDate' || field === 'endDate') {
                    aValue = a[field] ? new Date(a[field]) : null;
                    bValue = b[field] ? new Date(b[field]) : null;
                    if (aValue && isNaN(aValue.getTime())) aValue = null;
                    if (bValue && isNaN(bValue.getTime())) bValue = null;

                    if (aValue === null && bValue === null) return 0;
                    if (aValue === null) return sort.direction === 'asc' ? 1 : -1;
                    if (bValue === null) return sort.direction === 'asc' ? -1 : 1;
                    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
                    return 0;
                } else if (field === 'type' || field === 'status') {
                    // Utilisation des enums LeaveType/LeaveStatus
                    aValue = a[field]?.toString().toLowerCase() ?? '';
                    bValue = b[field]?.toString().toLowerCase() ?? '';
                } else {
                    // @ts-ignore Accès dynamique potentiellement risqué
                    aValue = (a as any)[field]?.toString().toLowerCase() ?? '';
                    // @ts-ignore
                    bValue = (b as any)[field]?.toString().toLowerCase() ?? '';
                }
            } catch (e) {
                console.error(`Erreur durant la récupération des valeurs pour le tri sur le champ ${String(field)}:`, e);
                return 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
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
                        // @ts-ignore - Support de la double structure de nommage
                        const firstName = leave.user?.firstName || leave.user?.prenom || '';
                        // @ts-ignore
                        const lastName = leave.user?.lastName || leave.user?.nom || '';
                        leaveValue = `${firstName} ${lastName}`.trim().toLowerCase();
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
                } catch (e) {
                    console.error(`Erreur durant le filtrage sur le champ ${String(key)}:`, e);
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
const validKeys: ReadonlyArray<SortableFilterableKeys> = ['id', 'userId', 'startDate', 'endDate', 'type', 'status', 'countedDays', 'reason', 'comment', 'requestDate', 'approvalDate', 'approvedBy', 'calculationDetails', 'createdAt', 'updatedAt', 'user'];
function isValidSortableFilterableKey(key: string): key is SortableFilterableKeys {
    return validKeys.includes(key as SortableFilterableKeys);
} 