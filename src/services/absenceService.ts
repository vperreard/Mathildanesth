import { PlannedAbsence, AbsenceCreateInput, AbsenceUpdateInput } from '@/types/absence';

export const absenceService = {
    async getAllAbsences(): Promise<PlannedAbsence[]> {
        const response = await fetch('http://localhost:3000/api/absences');
        if (!response.ok) {
            throw new Error('Failed to fetch absences');
        }
        return response.json();
    },

    async getAbsenceById(id: number): Promise<PlannedAbsence> {
        const response = await fetch(`http://localhost:3000/api/absences/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch absence');
        }
        return response.json();
    },

    async createAbsence(data: AbsenceCreateInput): Promise<PlannedAbsence> {
        const response = await fetch('http://localhost:3000/api/absences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                impactPlanning: data.impactPlanning ?? true,
                priority: data.priority ?? 5,
                notify: data.notify ?? false,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to create absence');
        }
        return response.json();
    },

    async updateAbsence(id: number, data: AbsenceUpdateInput): Promise<PlannedAbsence> {
        const response = await fetch(`http://localhost:3000/api/absences/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update absence');
        }
        return response.json();
    },

    async deleteAbsence(id: number): Promise<void> {
        const response = await fetch(`http://localhost:3000/api/absences/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete absence');
        }
    },

    async checkOverlap(userId: number, startDate: Date, endDate: Date): Promise<boolean> {
        const response = await fetch('http://localhost:3000/api/absences/check-overlap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, startDate, endDate }),
        });
        if (!response.ok) {
            throw new Error('Failed to check overlap');
        }
        return response.json();
    },
};