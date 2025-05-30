import { renderHook, act } from '@testing-library/react';
import {
    useLeaveListFilteringSorting,
    SortState,
    FilterValues
} from '../useLeaveListFilteringSorting';
import { LeaveWithUser, LeaveStatus, LeaveType } from '../../types/leave';
import { User, UserRole, ExperienceLevel } from '@/types/user'; // Assurez-vous que le chemin est correct

// Helper pour créer des dates
const d = (year: number, month: number, day: number) => new Date(year, month - 1, day);

// --- Données de Test --- 

const user1: User = { id: 'u1', prenom: 'Alice', nom: 'Alpha', email: 'alice@example.com', role: UserRole.DOCTOR, specialties: [], experienceLevel: ExperienceLevel.SENIOR, createdAt: d(2024, 1, 1), updatedAt: d(2024, 1, 1) };
const user2: User = { id: 'u2', prenom: 'Bob', nom: 'Bravo', email: 'bob@example.com', role: UserRole.DOCTOR, specialties: [], experienceLevel: ExperienceLevel.JUNIOR, createdAt: d(2024, 1, 1), updatedAt: d(2024, 1, 1) };
const user3: User = { id: 'u3', prenom: 'Charlie', nom: 'Charlie', email: 'charlie@example.com', role: UserRole.DOCTOR, specialties: [], experienceLevel: ExperienceLevel.INTERMEDIATE, createdAt: d(2024, 1, 1), updatedAt: d(2024, 1, 1) };

const mockLeavesData: LeaveWithUser[] = [
    {
        id: 'l1', userId: 'u1', user: user1, startDate: d(2024, 9, 5), endDate: d(2024, 9, 10),
        type: LeaveType.ANNUAL, status: LeaveStatus.APPROVED, countedDays: 4, reason: 'Vacances été',
        requestDate: d(2024, 8, 1), createdAt: d(2024, 8, 1), updatedAt: d(2024, 8, 2)
    },
    {
        id: 'l2', userId: 'u2', user: user2, startDate: d(2024, 9, 1), endDate: d(2024, 9, 3),
        type: LeaveType.SICK, status: LeaveStatus.PENDING, countedDays: 2, reason: 'Malade',
        requestDate: d(2024, 8, 20), createdAt: d(2024, 8, 20), updatedAt: d(2024, 8, 20)
    },
    {
        id: 'l3', userId: 'u3', user: user3, startDate: d(2024, 9, 5), endDate: d(2024, 9, 6),
        type: LeaveType.RECOVERY, status: LeaveStatus.APPROVED, countedDays: 2, reason: 'Recup garde',
        requestDate: d(2024, 8, 15), createdAt: d(2024, 8, 15), updatedAt: d(2024, 8, 16)
    },
    {
        id: 'l4', userId: 'u1', user: user1, startDate: d(2024, 8, 20), endDate: d(2024, 8, 22),
        type: LeaveType.ANNUAL, status: LeaveStatus.REJECTED, countedDays: 3, reason: 'Pont',
        requestDate: d(2024, 7, 10), createdAt: d(2024, 7, 10), updatedAt: d(2024, 7, 11)
    },
];

// --- Fin Données --- 

describe('useLeaveListFilteringSorting Hook', () => {

    // Helper pour rendre le hook avec des props changeantes
    const setupHook = (initialProps: { leaves: LeaveWithUser[], filter: FilterValues, sort: SortState }) => {
        return renderHook(({ leaves, filter, sort }) => useLeaveListFilteringSorting({ leaves, filter, sort }), {
            initialProps
        });
    };

    // == Tests de Tri ==
    describe('Sorting Logic', () => {
        const initialFilter: FilterValues = {};
        const initialLeaves = mockLeavesData;

        it('should sort by startDate descending by default (if initial state requires)', () => {
            // Note: L'état initial est géré par le composant qui utilise le hook.
            // Ici on simule l'état initial passé en props.
            const initialState: SortState = { field: 'startDate', direction: 'desc' };
            const { result } = setupHook({ leaves: initialLeaves, filter: initialFilter, sort: initialState });
            // l1 (5/9), l3 (5/9), l2 (1/9), l4 (20/8)
            expect(result.current.map(l => l.id)).toEqual(['l1', 'l3', 'l2', 'l4']);
        });

        it('should sort by startDate ascending', () => {
            const sortState: SortState = { field: 'startDate', direction: 'asc' };
            const { result } = setupHook({ leaves: initialLeaves, filter: initialFilter, sort: sortState });
            // l4 (20/8), l2 (1/9), l1 (5/9), l3 (5/9)
            expect(result.current.map(l => l.id)).toEqual(['l4', 'l2', 'l1', 'l3']);
        });

        it('should sort by user name ascending (handling different name structures)', () => {
            const sortState: SortState = { field: 'user', direction: 'asc' };
            const { result } = setupHook({ leaves: initialLeaves, filter: initialFilter, sort: sortState });
            // Alice Alpha (l1, l4), Bob Bravo (l2), Charlie Charlie (l3)
            expect(result.current.map(l => l.id)).toEqual(['l1', 'l4', 'l2', 'l3']);
        });

        it('should sort by user name descending', () => {
            const sortState: SortState = { field: 'user', direction: 'desc' };
            const { result } = setupHook({ leaves: initialLeaves, filter: initialFilter, sort: sortState });
            // Charlie Charlie (l3), Bob Bravo (l2), Alice Alpha (l1, l4)
            expect(result.current.map(l => l.id)).toEqual(['l3', 'l2', 'l1', 'l4']);
        });

        it('should sort by type ascending', () => {
            const sortState: SortState = { field: 'type', direction: 'asc' };
            const { result } = setupHook({ leaves: initialLeaves, filter: initialFilter, sort: sortState });
            // ANNUAL (l1, l4), RECOVERY (l3), SICK (l2)
            expect(result.current.map(l => l.id)).toEqual(['l1', 'l4', 'l3', 'l2']);
        });

        it('should sort by status descending', () => {
            const sortState: SortState = { field: 'status', direction: 'desc' };
            const { result } = setupHook({ leaves: initialLeaves, filter: initialFilter, sort: sortState });
            // REJECTED (l4), PENDING (l2), APPROVED (l1, l3)
            expect(result.current.map(l => l.id)).toEqual(['l4', 'l2', 'l1', 'l3']);
        });
    });

    // == Tests de Filtrage ==
    describe('Filtering Logic', () => {
        const initialSort: SortState = { field: 'startDate', direction: 'desc' }; // Tri initial pour prévisibilité
        const initialLeaves = mockLeavesData;

        it('should filter by user name (partial, case-insensitive)', () => {
            const filterState: FilterValues = { user: 'ali' }; // Alice
            const { result } = setupHook({ leaves: initialLeaves, filter: filterState, sort: initialSort });
            expect(result.current.map(l => l.id)).toEqual(['l1', 'l4']);
        });

        it('should filter by exact type', () => {
            const filterState: FilterValues = { type: LeaveType.SICK };
            const { result } = setupHook({ leaves: initialLeaves, filter: filterState, sort: initialSort });
            expect(result.current.map(l => l.id)).toEqual(['l2']);
        });

        it('should filter by exact status', () => {
            const filterState: FilterValues = { status: LeaveStatus.APPROVED };
            const { result } = setupHook({ leaves: initialLeaves, filter: filterState, sort: initialSort });
            // l1, l3 (triés par date desc)
            expect(result.current.map(l => l.id)).toEqual(['l1', 'l3']);
        });

        it('should filter by exact startDate (YYYY-MM-DD)', () => {
            const filterState: FilterValues = { startDate: '2024-09-05' };
            const { result } = setupHook({ leaves: initialLeaves, filter: filterState, sort: initialSort });
            // l1, l3
            expect(result.current.map(l => l.id)).toEqual(['l1', 'l3']);
        });

        it('should filter by reason (partial, case-insensitive)', () => {
            const filterState: FilterValues = { reason: 'mal' }; // Malade
            const { result } = setupHook({ leaves: initialLeaves, filter: filterState, sort: initialSort });
            expect(result.current.map(l => l.id)).toEqual(['l2']);
        });

        it('should combine multiple filters (user and status)', () => {
            const filterState: FilterValues = { user: 'alpha', status: LeaveStatus.APPROVED }; // Alice + Approuvé
            const { result } = setupHook({ leaves: initialLeaves, filter: filterState, sort: initialSort });
            expect(result.current.map(l => l.id)).toEqual(['l1']); // Seul l1 correspond
        });

        it('should return all leaves if filter is empty', () => {
            const filterState: FilterValues = {};
            const { result } = setupHook({ leaves: initialLeaves, filter: filterState, sort: initialSort });
            // Doit retourner tous les éléments, triés par défaut
            expect(result.current.length).toBe(4);
            expect(result.current.map(l => l.id)).toEqual(['l1', 'l3', 'l2', 'l4']);
        });

        it('should return empty array if no leaves match', () => {
            const filterState: FilterValues = { user: 'Zebra' };
            const { result } = setupHook({ leaves: initialLeaves, filter: filterState, sort: initialSort });
            expect(result.current).toEqual([]);
        });
    });

    // == Tests Combinés et Cas Limites ==
    describe('Combined Logic and Edge Cases', () => {
        it('should filter then sort', () => {
            const filterState: FilterValues = { type: LeaveType.ANNUAL }; // l1, l4
            const sortState: SortState = { field: 'user', direction: 'asc' }; // Alice Alpha
            // Le hook applique d'abord le tri puis le filtre sur le résultat trié.
            // Donc, tri initial: l1, l4, l3, l2 (par type asc)
            // Puis filtre sur ce résultat trié pour le type ANNUAL: l1, l4
            // (L'ordre final dépend si le filtre est appliqué avant ou après le tri dans l'implémentation useMemo)
            // DANS NOTRE IMPLÉMENTATION : on trie d'abord, puis on filtre.
            // Tri par user asc: l1, l4, l2, l3
            // Filtre sur type ANNUAL: l1, l4
            const { result } = setupHook({ leaves: mockLeavesData, filter: filterState, sort: sortState });
            expect(result.current.map(l => l.id)).toEqual(['l1', 'l4']);

            // Changer le tri pour vérifier
            const sortStateDesc: SortState = { field: 'startDate', direction: 'desc' }; // l1(5/9), l4(20/8)
            const { result: result2 } = setupHook({ leaves: mockLeavesData, filter: filterState, sort: sortStateDesc });
            expect(result2.current.map(l => l.id)).toEqual(['l1', 'l4']);

        });

        it('should handle empty leaves array input', () => {
            const { result } = setupHook({ leaves: [], filter: {}, sort: { field: 'startDate', direction: 'asc' } });
            expect(result.current).toEqual([]);
        });
    });
}); 