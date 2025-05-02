import { v4 as uuidv4 } from 'uuid';
import {
    Leave,
    LeaveStatus,
    RecurrenceFrequency,
    RecurrenceEndType,
    RecurrencePattern
} from '../types/leave';
import { addDays, addMonths, addWeeks, addYears, isBefore, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { differenceInCalendarDays } from 'date-fns';

// Fonction utilitaire pour vérifier si une date est un jour férié
// À implémenter avec une bibliothèque appropriée ou une API externe
const isHoliday = (date: Date, options: { locale: Locale }): boolean => {
    // Implémentation simplifiée - à remplacer par une vraie vérification
    // Exemple: utiliser @date/holidays ou une API externe
    return false;
};

// Interface pour le service de congés
interface ILeaveService {
    createLeave(leave: Leave): Promise<Leave>;
    updateLeave(leave: Leave): Promise<Leave>;
    deleteLeave(id: string): Promise<void>;
    getLeaveById(id: string): Promise<Leave | null>;
}

export class RecurringLeaveService {
    private leaveService: ILeaveService;

    constructor(leaveService: ILeaveService) {
        this.leaveService = leaveService;
    }

    /**
     * Génère les occurrences d'un congé récurrent
     * @param leave Congé parent avec configuration de récurrence
     * @returns Liste des occurrences générées
     */
    public async generateOccurrences(leave: Leave): Promise<Leave[]> {
        if (!leave.isRecurring || !leave.recurrencePattern) {
            throw new Error('Le congé n\'est pas récurrent');
        }

        const occurrences: Leave[] = [];
        const pattern = leave.recurrencePattern;
        const duration = differenceInCalendarDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;

        let currentDate = new Date(leave.startDate);
        let count = 0;

        // Détermine la date de fin selon le type de fin
        const endDate = this.calculateEndDate(pattern);

        while (
            (pattern.endType === RecurrenceEndType.NEVER ||
                (pattern.endType === RecurrenceEndType.UNTIL_DATE && isBefore(currentDate, endDate)) ||
                (pattern.endType === RecurrenceEndType.COUNT && count < (pattern.endCount || 0))) &&
            count < 100 // Limite de sécurité pour éviter les boucles infinies
        ) {
            // Calcule la prochaine date selon la fréquence
            currentDate = this.getNextOccurrenceDate(currentDate, pattern);

            // Vérifie si on doit sauter cette date (weekend ou jour férié)
            if (this.shouldSkipDate(currentDate, pattern)) {
                continue;
            }

            // Calcule la date de fin pour cette occurrence
            const occurrenceEndDate = addDays(currentDate, duration - 1);

            // Crée une nouvelle occurrence
            const occurrence: Leave = {
                ...this.createOccurrenceFromParent(leave, currentDate, occurrenceEndDate),
                parentId: leave.id,
            };

            occurrences.push(occurrence);
            count++;
        }

        return occurrences;
    }

    /**
     * Calcule la date de la prochaine occurrence selon le motif de récurrence
     */
    private getNextOccurrenceDate(currentDate: Date, pattern: RecurrencePattern): Date {
        switch (pattern.frequency) {
            case RecurrenceFrequency.DAILY:
                return addDays(currentDate, pattern.interval);
            case RecurrenceFrequency.WEEKLY:
                return addWeeks(currentDate, pattern.interval);
            case RecurrenceFrequency.MONTHLY:
                return addMonths(currentDate, pattern.interval);
            case RecurrenceFrequency.YEARLY:
                return addYears(currentDate, pattern.interval);
            default:
                throw new Error('Fréquence de récurrence non supportée');
        }
    }

    /**
     * Détermine si une date doit être ignorée (weekend, jour férié)
     */
    private shouldSkipDate(date: Date, pattern: RecurrencePattern): boolean {
        if (pattern.skipWeekends && isWeekend(date)) {
            return true;
        }

        if (pattern.skipHolidays && isHoliday(date, { locale: fr })) {
            return true;
        }

        // Vérification des jours spécifiques pour récurrence hebdomadaire
        if (pattern.frequency === RecurrenceFrequency.WEEKLY && pattern.weekdays) {
            const dayOfWeek = date.getDay();
            // Conversion du format JS (0=dimanche) au format utilisateur (0=lundi)
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            return !pattern.weekdays.includes(adjustedDay);
        }

        return false;
    }

    /**
     * Calcule la date de fin selon le type de fin de récurrence
     */
    private calculateEndDate(pattern: RecurrencePattern): Date {
        switch (pattern.endType) {
            case RecurrenceEndType.NEVER:
                // Date arbitrairement lointaine
                return new Date(2099, 11, 31);
            case RecurrenceEndType.UNTIL_DATE:
                return pattern.endDate || new Date(2099, 11, 31);
            case RecurrenceEndType.COUNT:
                // Gérée dans la boucle principale
                return new Date(2099, 11, 31);
            default:
                return new Date(2099, 11, 31);
        }
    }

    /**
     * Crée une occurrence à partir du congé parent
     */
    private createOccurrenceFromParent(parent: Leave, startDate: Date, endDate: Date): Leave {
        return {
            id: uuidv4(),
            userId: parent.userId,
            startDate,
            endDate,
            type: parent.type,
            status: LeaveStatus.PENDING,
            countedDays: parent.countedDays,
            reason: parent.reason,
            requestDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            parentId: parent.id,
            isRecurring: false, // Les occurrences ne sont pas récurrentes elles-mêmes
        };
    }

    /**
     * Sauvegarde un congé récurrent et ses occurrences
     */
    public async saveRecurringLeave(leave: Leave): Promise<Leave> {
        // Sauvegarde d'abord le congé parent
        const savedParent = await this.leaveService.createLeave(leave);

        // Génère et sauvegarde les occurrences
        const occurrences = await this.generateOccurrences(savedParent);

        // Save each occurrence
        const savedOccurrences = await Promise.all(
            occurrences.map(occurrence => this.leaveService.createLeave(occurrence))
        );

        // Met à jour le parent avec les références aux occurrences
        savedParent.occurrences = savedOccurrences;
        return this.leaveService.updateLeave(savedParent);
    }

    /**
     * Met à jour une série récurrente
     * @param leave Congé à mettre à jour
     * @param updateType Type de mise à jour (cette occurrence, celle-ci et suivantes, toute la série)
     */
    public async updateRecurringSeries(
        leave: Leave,
        updateType: 'single' | 'thisAndForward' | 'all'
    ): Promise<Leave[]> {
        switch (updateType) {
            case 'single':
                return [await this.leaveService.updateLeave(leave)];

            case 'thisAndForward':
                // Met à jour cette occurrence
                await this.leaveService.updateLeave(leave);

                // Supprime les occurrences futures
                if (leave.parentId) {
                    const parent = await this.leaveService.getLeaveById(leave.parentId);

                    if (parent && parent.occurrences) {
                        // Supprime les occurrences futures
                        const futureOccurrences = parent.occurrences.filter(
                            o => new Date(o.startDate) > new Date(leave.startDate) && o.id !== leave.id
                        );

                        await Promise.all(
                            futureOccurrences.map(o => this.leaveService.deleteLeave(o.id))
                        );

                        // Génère de nouvelles occurrences à partir de la date actuelle
                        const newPattern = { ...parent.recurrencePattern };

                        // Crée un nouveau parent temporaire pour la génération
                        const tempParent: Leave = {
                            ...parent,
                            startDate: leave.startDate,
                            endDate: leave.endDate,
                            recurrencePattern: newPattern,
                        };

                        const newOccurrences = await this.generateOccurrences(tempParent);
                        const savedOccurrences = await Promise.all(
                            newOccurrences.map(o => this.leaveService.createLeave(o))
                        );

                        return [leave, ...savedOccurrences];
                    }
                }
                return [leave];

            case 'all':
                // Si c'est une occurrence, on récupère le parent
                const parentId = leave.parentId || leave.id;
                const parent = await this.leaveService.getLeaveById(parentId);

                if (!parent) {
                    throw new Error('Congé parent non trouvé');
                }

                // Met à jour le parent avec les nouvelles infos
                const updatedParent: Leave = {
                    ...parent,
                    type: leave.type,
                    reason: leave.reason,
                    countedDays: leave.countedDays,
                    // La date peut changer mais on conserve l'intervalle
                    startDate: leave.startDate,
                    endDate: leave.endDate,
                    updatedAt: new Date(),
                };

                await this.leaveService.updateLeave(updatedParent);

                // Supprime toutes les occurrences existantes
                if (parent.occurrences) {
                    await Promise.all(
                        parent.occurrences.map(o => this.leaveService.deleteLeave(o.id))
                    );
                }

                // Génère de nouvelles occurrences
                const newOccurrences = await this.generateOccurrences(updatedParent);
                const savedOccurrences = await Promise.all(
                    newOccurrences.map(o => this.leaveService.createLeave(o))
                );

                // Met à jour le parent avec les nouvelles occurrences
                updatedParent.occurrences = savedOccurrences;
                await this.leaveService.updateLeave(updatedParent);

                return [updatedParent, ...savedOccurrences];

            default:
                throw new Error('Type de mise à jour non valide');
        }
    }
} 