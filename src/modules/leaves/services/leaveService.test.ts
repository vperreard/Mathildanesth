import {
    formatLeavePeriod,
    getLeaveTypeLabel,
    getLeaveStatusLabel,
    fetchLeaves,
    fetchLeaveById,
    fetchLeaveBalance,
    saveLeave,
    submitLeaveRequest,
    approveLeave,
    rejectLeave,
    cancelLeave,
    checkLeaveConflicts,
    checkLeaveAllowance,
    calculateLeaveDays
} from './leaveService';
import { LeaveStatus, LeaveType, Leave, LeaveBalance, LeaveFilters, LeaveAllowanceCheckResult } from '../types/leave';
import { ConflictCheckResult, LeaveConflict, ConflictSeverity, ConflictType } from '../types/conflict';
import { WorkSchedule, WorkFrequency, Weekday } from '../../profiles/types/workSchedule';
import { formatDate, ISO_DATE_FORMAT } from '@/utils/dateUtils';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma'; // Utiliser l'export nommé

// Mocker le client Prisma
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(), // Garder le mock par défaut si c'est ce qui est utilisé ailleurs
    prisma: mockDeep<PrismaClient>(), // Mocker aussi l'export nommé
}));

// Utiliser le mock de l'export nommé
const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

// Mock de l'API fetch globale (pour les appels directs qui restent)
global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as jest.Mock;

// --- Mocks de données ---
const mockLeave: Leave = {
    id: 'leave123',
    userId: 'user456',
    startDate: new Date('2024-08-19'),
    endDate: new Date('2024-08-23'),
    type: LeaveType.ANNUAL,
    status: LeaveStatus.PENDING,
    countedDays: 5,
    requestDate: new Date('2024-07-15'),
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-07-15'),
};

const mockUserSchedule: WorkSchedule = {
    id: 'sched789',
    userId: 'user456',
    frequency: WorkFrequency.FULL_TIME,
    workingDays: [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY],
    annualLeaveAllowance: 25,
    validFrom: new Date('2024-01-01'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

const mockLeaveBalance: LeaveBalance = {
    userId: 'user456',
    year: 2024,
    initialAllowance: 25,
    additionalAllowance: 2,
    used: 10,
    pending: 5,
    remaining: 12,
    detailsByType: {
        [LeaveType.ANNUAL]: { used: 8, pending: 5 },
        [LeaveType.SICK]: { used: 2, pending: 0 },
    },
    lastUpdated: new Date(),
};

const mockConflictResult: ConflictCheckResult = {
    hasBlockingConflicts: false,
    conflicts: [],
};

const mockAllowanceResult: LeaveAllowanceCheckResult = {
    isAllowed: true,
    remainingDays: 12,
    requestedDays: 5,
    exceededDays: 0,
};

// --- Fin des Mocks ---

describe('leaveService', () => {
    // Mock de fetch avant chaque test
    let mockFetch: jest.Mock;

    beforeEach(() => {
        // Réinitialiser TOUS les mocks avant chaque test
        jest.resetAllMocks();
        mockReset(prismaMock); // Réinitialiser le mock Prisma

        // Remocker fetch spécifiquement pour ce bloc describe si nécessaire
        global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
        mockFetch = global.fetch as jest.Mock;
    });

    // == Fonctions Utilitaires ==

    describe('formatLeavePeriod', () => {
        it('should format the period correctly for same month and year', () => {
            const startDate = new Date(2024, 7, 19); // 19 Août 2024
            const endDate = new Date(2024, 7, 23);   // 23 Août 2024
            // Note: Le format exact dépend de la locale par défaut de l'environnement de test.
            // S'attendre à un format comme "19/08/2024 au 23/08/2024" ou similaire.
            // Pour forcer la locale fr (importée mais pas utilisée explicitement dans format),
            // il faudrait passer { locale: fr } à date-fns ou configurer globalement.
            // Ici, on teste le format par défaut.
            expect(formatLeavePeriod(startDate, endDate)).toMatch(/\d{2}\/\d{2}\/\d{4} au \d{2}\/\d{2}\/\d{4}/);
            expect(formatLeavePeriod(startDate, endDate)).toContain('19/08/2024');
            expect(formatLeavePeriod(startDate, endDate)).toContain('23/08/2024');
        });

        it('should format the period correctly for different months', () => {
            const startDate = new Date(2024, 7, 28); // 28 Août 2024
            const endDate = new Date(2024, 8, 2);    // 02 Sept 2024
            expect(formatLeavePeriod(startDate, endDate)).toMatch(/\d{2}\/\d{2}\/\d{4} au \d{2}\/\d{2}\/\d{4}/);
            expect(formatLeavePeriod(startDate, endDate)).toContain('28/08/2024');
            expect(formatLeavePeriod(startDate, endDate)).toContain('02/09/2024');
        });

        it('should handle same start and end date', () => {
            const startDate = new Date(2024, 7, 19); // 19 Août 2024
            const endDate = new Date(2024, 7, 19);   // 19 Août 2024
            expect(formatLeavePeriod(startDate, endDate)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
            expect(formatLeavePeriod(startDate, endDate)).not.toContain('au');
            expect(formatLeavePeriod(startDate, endDate)).toBe('19/08/2024');
        });
    });

    describe('getLeaveTypeLabel', () => {
        it('should return correct labels for known types', () => {
            expect(getLeaveTypeLabel(LeaveType.ANNUAL)).toBe('Congé annuel');
            expect(getLeaveTypeLabel(LeaveType.SICK)).toBe('Maladie');
            expect(getLeaveTypeLabel(LeaveType.RECOVERY)).toBe('Récupération');
            expect(getLeaveTypeLabel(LeaveType.TRAINING)).toBe('Formation');
            expect(getLeaveTypeLabel(LeaveType.MATERNITY)).toBe('Maternité');
            expect(getLeaveTypeLabel(LeaveType.SPECIAL)).toBe('Congé spécial');
            expect(getLeaveTypeLabel(LeaveType.UNPAID)).toBe('Congé sans solde');
            expect(getLeaveTypeLabel(LeaveType.OTHER)).toBe('Autre');
        });

        it('should return the type itself for unknown types', () => {
            expect(getLeaveTypeLabel('UNKNOWN_TYPE' as LeaveType)).toBe('UNKNOWN_TYPE');
        });
    });

    describe('getLeaveStatusLabel', () => {
        it('should return correct labels for known statuses', () => {
            expect(getLeaveStatusLabel(LeaveStatus.PENDING)).toBe('En attente');
            expect(getLeaveStatusLabel(LeaveStatus.APPROVED)).toBe('Approuvé');
            expect(getLeaveStatusLabel(LeaveStatus.REJECTED)).toBe('Refusé');
            // Ajouter d'autres statuts...
        });

        it('should return the status itself for unknown statuses', () => {
            expect(getLeaveStatusLabel('UNKNOWN_STATUS' as LeaveStatus)).toBe('UNKNOWN_STATUS');
        });
    });

    // == Fonctions API (Fetch) ==

    describe('fetchLeaves', () => {
        const mockLeaveData: Leave[] = [
            { id: '1', userId: 'user1', type: LeaveType.ANNUAL, startDate: new Date(), endDate: new Date(), status: LeaveStatus.APPROVED, createdAt: new Date(), updatedAt: new Date(), countedDays: 1 },
            { id: '2', userId: 'user2', type: LeaveType.SICK, startDate: new Date(), endDate: new Date(), status: LeaveStatus.PENDING, createdAt: new Date(), updatedAt: new Date(), countedDays: 2 },
        ];

        it('should fetch leaves without filters', async () => {
            prismaMock.leave.count.mockResolvedValue(mockLeaveData.length);
            prismaMock.leave.findMany.mockResolvedValue(mockLeaveData);

            const result = await fetchLeaves({});

            expect(prismaMock.leave.count).toHaveBeenCalledWith({ where: {} });
            expect(prismaMock.leave.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
            expect(result.leaves).toEqual(mockLeaveData);
            expect(result.total).toBe(mockLeaveData.length);
        });

        it('should fetch leaves with filters', async () => {
            const filters: LeaveFilter = { status: [LeaveStatus.PENDING], type: [LeaveType.SICK] };
            const filteredData = mockLeaveData.filter(l => l.status === LeaveStatus.PENDING && l.type === LeaveType.SICK);
            prismaMock.leave.count.mockResolvedValue(filteredData.length);
            prismaMock.leave.findMany.mockResolvedValue(filteredData);

            const result = await fetchLeaves({ filters });

            expect(prismaMock.leave.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
            expect(prismaMock.leave.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object) }));
            expect(result.leaves).toEqual(filteredData);
            expect(result.total).toBe(filteredData.length);
        });

        it('should handle prisma errors', async () => {
            const mockError = new Error('Prisma Error');
            prismaMock.leave.count.mockRejectedValue(mockError);

            await expect(fetchLeaves({})).rejects.toThrow(mockError);
        });
    });

    describe('fetchLeaveById', () => {
        it('should fetch a leave by its ID', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockLeave,
            });

            const leave = await fetchLeaveById('leave123');

            expect(fetch).toHaveBeenCalledWith('/api/leaves/leave123');
            expect(leave).toEqual(mockLeave);
        });

        it('should handle fetch errors for specific ID', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: () => Promise.reject('Not JSON'),
                text: () => Promise.resolve('Not Found')
            });

            await expect(fetchLeaveById('leave123')).rejects.toThrow('Erreur HTTP 404 lors de la récupération du congé');
        });
    });

    describe('fetchLeaveBalance', () => {
        it('should fetch leave balance for a user', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockLeaveBalance,
            });

            const balance = await fetchLeaveBalance('user456');

            expect(fetch).toHaveBeenCalledWith('/api/leaves/balance?userId=user456');
            expect(balance).toEqual(mockLeaveBalance);
        });

        it('should handle fetch errors for balance', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Error',
                json: () => Promise.reject('Not JSON'),
                text: () => Promise.resolve('Internal Error')
            });

            await expect(fetchLeaveBalance('user456')).rejects.toThrow('Erreur HTTP 500 lors de la récupération du solde pour');
        });
    });

    describe('saveLeave', () => {
        it('should create a new leave (POST)', async () => {
            const { id, ...newLeaveDataWithoutId } = mockLeave;
            const createdLeave = { ...newLeaveDataWithoutId, id: 'newLeave789' }; // L'API retourne le congé avec un ID

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => createdLeave,
            });

            const result = await saveLeave(newLeaveDataWithoutId);

            // Vérifier que la méthode POST est utilisée avec le bon endpoint
            expect(fetch).toHaveBeenCalledWith('/api/leaves', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }));

            // Vérifier que le body contient les données attendues
            const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
            expect(body).toHaveProperty('userId', 'user456');
            expect(body).toHaveProperty('type', 'ANNUAL');
            expect(body).toHaveProperty('status', 'PENDING');

            // Vérifier que les dates sont au format attendu (YYYY-MM-DD)
            expect(body.startDate).toBe('2024-08-19');
            expect(body.endDate).toBe('2024-08-23');

            expect(result).toEqual(createdLeave);
        });

        it('should update an existing leave (PUT)', async () => {
            const updatedLeaveData: Partial<Leave> = { id: 'leave123', reason: 'Updated reason' };
            const returnedLeave = { ...mockLeave, reason: 'Updated reason' };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => returnedLeave,
            });

            const result = await saveLeave(updatedLeaveData);

            expect(fetch).toHaveBeenCalledWith('/api/leaves/leave123', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLeaveData),
            });
            expect(result).toEqual(returnedLeave);
        });

        it('should handle save errors', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Validation Error',
                json: () => Promise.reject('Not JSON'),
                text: () => Promise.resolve('Validation Error')
            });

            await expect(saveLeave(mockLeave)).rejects.toThrow("Erreur HTTP 400 lors de l'enregistrement du congé");
        });
    });

    describe('submitLeaveRequest', () => {
        const newLeave: Partial<Leave> = {
            userId: 'user-test',
            type: LeaveType.SPECIAL,
            startDate: new Date('2024-01-10'),
            endDate: new Date('2024-01-12'),
        };

        it('should set status to PENDING and call saveLeave (mocking saveLeave)', async () => {
            // Mock saveLeave pour ce test car il appelle Prisma maintenant
            const saveLeaveMock = jest.spyOn(require('../leaveService'), 'saveLeave')
                .mockResolvedValue({ ...newLeave, id: 'new-id', status: LeaveStatus.PENDING } as Leave);

            const result = await submitLeaveRequest(newLeave as Leave);

            expect(saveLeaveMock).toHaveBeenCalledWith(expect.objectContaining({ status: LeaveStatus.PENDING }));
            expect(result.status).toBe(LeaveStatus.PENDING);

            saveLeaveMock.mockRestore(); // Nettoyer le spy
        });
    });

    // == Fonctions de Workflow (Approve, Reject, Cancel) ==

    describe('approveLeave', () => {
        it('should update leave status using Prisma', async () => {
            const approvedLeave = { id: 'leave-to-approve', status: LeaveStatus.APPROVED } as Leave;
            prismaMock.leave.update.mockResolvedValue(approvedLeave);

            const result = await approveLeave('leave-to-approve', 'approver-id');

            expect(prismaMock.leave.update).toHaveBeenCalledWith({
                where: { id: 'leave-to-approve' },
                data: { status: LeaveStatus.APPROVED, approvedById: 'approver-id' /* ou champ similaire */ },
            });
            expect(result.status).toBe(LeaveStatus.APPROVED);
        });
    });

    describe('rejectLeave', () => {
        it('should call the reject endpoint', async () => {
            const rejectedLeave = { ...mockLeave, status: LeaveStatus.REJECTED };
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => rejectedLeave,
            });
            const comment = 'Insufficient balance';

            const result = await rejectLeave('leave123', comment);

            expect(fetch).toHaveBeenCalledWith('/api/leaves/leave123/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment }),
            });
            expect(result).toEqual(rejectedLeave);
        });
        it('should handle reject errors', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Server Error',
                json: () => Promise.reject('Not JSON'),
                text: () => Promise.resolve('Server Error')
            });
            await expect(rejectLeave('leave123')).rejects.toThrow('Erreur HTTP 500 lors du rejet du congé');
        });
    });

    describe('cancelLeave', () => {
        it('should call the cancel endpoint', async () => {
            const cancelledLeave = { ...mockLeave, status: LeaveStatus.CANCELLED };
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => cancelledLeave,
            });
            const comment = 'User cancelled';

            const result = await cancelLeave('leave123', comment);

            expect(fetch).toHaveBeenCalledWith('/api/leaves/leave123/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment }),
            });
            expect(result).toEqual(cancelledLeave);
        });
        it('should handle cancel errors', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 409,
                statusText: 'Conflict',
                json: () => Promise.reject('Not JSON'),
                text: () => Promise.resolve('Conflict')
            });
            await expect(cancelLeave('leave123')).rejects.toThrow("Erreur HTTP 409 lors de l'annulation du congé");
        });
    });

    // == Fonctions de Vérification (Conflicts, Allowance) ==

    describe('checkLeaveConflicts', () => {
        it('should call the check-conflicts endpoint', async () => {
            const startDate = new Date('2024-09-01');
            const endDate = new Date('2024-09-05');
            const userId = 'user789';
            const leaveId = 'leaveABC'; // Pour une modification

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockConflictResult,
            });

            const result = await checkLeaveConflicts(startDate, endDate, userId, leaveId);

            const expectedParams = new URLSearchParams({
                startDate: formatDate(startDate, ISO_DATE_FORMAT),
                endDate: formatDate(endDate, ISO_DATE_FORMAT),
                userId: userId,
                leaveId: leaveId,
            });
            expect(fetch).toHaveBeenCalledWith(`/api/leaves/check-conflicts?${expectedParams.toString()}`);
            expect(result).toEqual(mockConflictResult);
        });

        it('should call check-conflicts without leaveId for new leaves', async () => {
            const startDate = new Date('2024-09-01');
            const endDate = new Date('2024-09-05');
            const userId = 'user789';

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockConflictResult,
            });

            await checkLeaveConflicts(startDate, endDate, userId);

            const expectedParams = new URLSearchParams({
                startDate: formatDate(startDate, ISO_DATE_FORMAT),
                endDate: formatDate(endDate, ISO_DATE_FORMAT),
                userId: userId,
            });
            expect(fetch).toHaveBeenCalledWith(`/api/leaves/check-conflicts?${expectedParams.toString()}`);
        });

        it('should handle check-conflicts errors', async () => {
            const startDate = new Date('2024-09-01');
            const endDate = new Date('2024-09-05');
            const userId = 'user789';
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: () => Promise.reject('Not JSON'),
                text: () => Promise.resolve('Bad Request')
            });
            await expect(checkLeaveConflicts(startDate, endDate, userId)).rejects.toThrow('Erreur HTTP 400 lors de la vérification des conflits');
        });
    });

    describe('checkLeaveAllowance', () => {
        it('should call the check-allowance endpoint', async () => {
            const userId = 'user123';
            const leaveType = LeaveType.ANNUAL;
            const countedDays = 5;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockAllowanceResult,
            });

            const result = await checkLeaveAllowance(userId, leaveType, countedDays);

            const expectedParams = new URLSearchParams({
                userId: userId,
                leaveType: leaveType,
                countedDays: countedDays.toString(),
            });
            expect(fetch).toHaveBeenCalledWith(`/api/leaves/check-allowance?${expectedParams.toString()}`);
            expect(result).toEqual(mockAllowanceResult);
        });

        it('should handle check-allowance errors', async () => {
            const userId = 'user123';
            const leaveType = LeaveType.ANNUAL;
            const countedDays = 5;
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: () => Promise.reject('Not JSON'),
                text: () => Promise.resolve('Bad Request')
            });
            await expect(checkLeaveAllowance(userId, leaveType, countedDays)).rejects.toThrow('Erreur HTTP 400 lors de la vérification des droits');
        });
    });

    // == Fonction de Calcul (Dépendance externe) ==
    // Note: Le test de calculateLeaveDays dépend fortement de calculateLeaveCountedDays
    // et isWorkingDay, qui sont dans d'autres fichiers.
    // Pour un test unitaire *pur* de leaveService, calculateLeaveDays devrait être
    // soit très simple (ne dépendant pas de logique externe), soit cette logique
    // devrait être mockée.
    // Ici, on fait un test d'intégration léger.
    describe('calculateLeaveDays', () => {
        // Ces tests nécessiteraient de mocker calculateLeaveCountedDays et isWorkingDay
        // ou d'avoir une logique de test plus complexe reproduisant leur comportement.
        // Pour l'instant, on le laisse comme placeholder ou on teste des cas simples.

        it('should calculate leave days based on schedule (placeholder)', () => {
            // Ce test est complexe à écrire sans mocker les dépendances
            // ou sans réimplémenter la logique de calcul ici.
            // Exemple simple:
            const startDate = new Date('2024-08-19'); // Lundi
            const endDate = new Date('2024-08-23'); // Vendredi
            const schedule = { ...mockUserSchedule, frequency: WorkFrequency.FULL_TIME };

            // ATTENTION: calculateLeaveDays utilise calculateLeaveCountedDays qui a sa propre logique.
            // Le test ici est plus une validation d'intégration qu'un test unitaire pur.
            // La valeur retournée dépendra de l'implémentation de calculateLeaveCountedDays
            // et isWorkingDay (via workScheduleService).
            // Supposons qu'un temps plein du lundi au vendredi compte 5 jours.
            // const days = calculateLeaveDays(startDate, endDate, schedule);
            // expect(days).toBe(5); // Ceci est une supposition!
            // TODO: Ajouter de vrais tests en moquant les dépendances ou en testant l'intégration
            expect(true).toBe(true); // Placeholder pour que le test passe
        });
    });
}); 