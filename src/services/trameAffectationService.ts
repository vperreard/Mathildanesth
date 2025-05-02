import { toast } from 'react-hot-toast';
import TrameAffectation, { TrameAffectationAttributes } from '@/models/TrameAffectation';

// Types
export type WeekType = 'EVEN' | 'ODD' | 'ALL';
export type DayType = 'WEEKDAY' | 'WEEKEND';
export type PostType = 'CHIRURGIEN' | 'MAR' | 'IADE' | 'INFIRMIER' | 'AUTRE';
export type AssignmentType = 'GARDE' | 'ASTREINTE' | 'CS1' | 'CS2' | 'CS3' | 'SALLE';

export interface Post {
    id: string;
    type: PostType;
    name: string;
    required: boolean;
    maxCount: number;
    minCount: number;
}

export interface Assignment {
    id: string;
    type: AssignmentType;
    name: string;
    duration: number; // en heures
    posts: Post[];
    isActive: boolean;
}

export interface TramePeriod {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    color: string;
    isActive: boolean;
    assignments: Assignment[];
    isLocked: boolean;
}

export interface Trame {
    id: string;
    name: string;
    description: string;
    weekType: WeekType;
    dayType: DayType;
    periods: TramePeriod[];
    isActive: boolean;
    isLocked: boolean;
    version?: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
}

export interface ValidationError {
    type: 'PERIOD_OVERLAP' | 'MISSING_REQUIRED_POST' | 'TIME_CONSTRAINT' | 'LEGAL_CONSTRAINT' | 'BUSINESS_RULE';
    message: string;
    periodId?: string;
    assignmentId?: string;
    details?: any;
}

// Helpers
const generateId = (): string => {
    return Math.random().toString(36).substring(2, 9);
};

// API Endpoints
const API_ENDPOINTS = {
    TRAMES: '/api/trames',
    TRAME: (id: string) => `/api/trames/${id}`,
    SUGGESTIONS: '/api/trames/suggestions',
    VALIDATE: '/api/trames/validate',
    EXPORT: '/api/trames/export',
    IMPORT: '/api/trames/import',
};

// Service
export const TrameAffectationService = {
    // Méthodes CRUD pour les tests
    /**
     * Crée une nouvelle trame d'affectation
     * @param data Les données de la nouvelle trame
     * @returns Les attributs de la trame créée
     */
    async create(data: Omit<TrameAffectationAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrameAffectationAttributes> {
        try {
            const trame = await TrameAffectation.create(data as any);
            // Dans les tests, le mock retourne directement les attributs, pas d'instance avec toJSON
            return trame && typeof trame.toJSON === 'function' ? trame.toJSON() : trame as TrameAffectationAttributes;
        } catch (error) {
            console.error('Erreur lors de la création de la trame d\'affectation:', error);
            throw new Error('Impossible de créer la trame d\'affectation');
        }
    },

    /**
     * Récupère toutes les trames d'affectation
     * @returns Une liste d'attributs de trames d'affectation
     */
    async findAll(): Promise<TrameAffectationAttributes[]> {
        try {
            const trames = await TrameAffectation.findAll({
                order: [['createdAt', 'DESC']],
            });
            // Dans les tests, le mock retourne directement un tableau d'attributs
            return Array.isArray(trames)
                ? trames.map(trame => typeof trame.toJSON === 'function' ? trame.toJSON() : trame as TrameAffectationAttributes)
                : trames as TrameAffectationAttributes[];
        } catch (error) {
            console.error('Erreur lors de la récupération des trames d\'affectation:', error);
            throw new Error('Impossible de récupérer les trames d\'affectation');
        }
    },

    /**
     * Récupère une trame d'affectation par son ID
     * @param id L'ID de la trame à récupérer
     * @returns Les attributs de la trame trouvée
     */
    async findById(id: string): Promise<TrameAffectationAttributes> {
        try {
            const trame = await TrameAffectation.findByPk(id);
            if (!trame) {
                throw new Error('Trame d\'affectation non trouvée');
            }
            // Dans les tests, le mock retourne directement les attributs
            return typeof trame.toJSON === 'function' ? trame.toJSON() : trame as TrameAffectationAttributes;
        } catch (error) {
            if ((error as Error).message === 'Trame d\'affectation non trouvée') {
                throw error;
            }
            console.error(`Erreur lors de la récupération de la trame d'affectation ${id}:`, error);
            throw new Error('Impossible de récupérer la trame d\'affectation');
        }
    },

    /**
     * Met à jour une trame d'affectation existante
     * @param id L'ID de la trame à mettre à jour
     * @param data Les nouvelles données de la trame
     * @returns Les attributs de la trame mise à jour
     */
    async update(id: string, data: Partial<TrameAffectationAttributes>): Promise<TrameAffectationAttributes> {
        try {
            const [updatedRowsCount] = await TrameAffectation.update(data, {
                where: { id }
            });

            if (updatedRowsCount === 0) {
                throw new Error('Trame d\'affectation non trouvée');
            }

            return this.findById(id);
        } catch (error) {
            if ((error as Error).message === 'Trame d\'affectation non trouvée') {
                throw error;
            }
            console.error(`Erreur lors de la mise à jour de la trame d'affectation ${id}:`, error);
            throw new Error('Impossible de mettre à jour la trame d\'affectation');
        }
    },

    /**
     * Supprime une trame d'affectation
     * @param id L'ID de la trame à supprimer
     * @returns true si la suppression a réussi
     */
    async delete(id: string): Promise<boolean> {
        try {
            const deletedRowsCount = await TrameAffectation.destroy({
                where: { id }
            });

            if (deletedRowsCount === 0) {
                throw new Error('Trame d\'affectation non trouvée');
            }

            return true;
        } catch (error) {
            if ((error as Error).message === 'Trame d\'affectation non trouvée') {
                throw error;
            }
            console.error(`Erreur lors de la suppression de la trame d'affectation ${id}:`, error);
            throw new Error('Impossible de supprimer la trame d\'affectation');
        }
    },

    /**
     * Récupère les trames d'affectation d'un utilisateur spécifique
     * @param userId L'ID de l'utilisateur
     * @returns Une liste d'attributs de trames d'affectation
     */
    async findByUserId(userId: number): Promise<TrameAffectationAttributes[]> {
        try {
            const trames = await TrameAffectation.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
            });
            // Dans les tests, le mock retourne directement un tableau d'attributs
            return Array.isArray(trames)
                ? trames.map(trame => typeof trame.toJSON === 'function' ? trame.toJSON() : trame as TrameAffectationAttributes)
                : trames as TrameAffectationAttributes[];
        } catch (error) {
            console.error(`Erreur lors de la récupération des trames d'affectation de l'utilisateur ${userId}:`, error);
            throw new Error('Impossible de récupérer les trames d\'affectation de l\'utilisateur');
        }
    },

    // Chargement des trames
    async getAllTrames(): Promise<Trame[]> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAMES);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des trames');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des trames:', error);
            toast.error('Impossible de charger les trames');
            return [];
        }
    },

    async getTrame(id: string): Promise<Trame | null> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAME(id));
            if (!response.ok) {
                throw new Error('Erreur lors du chargement de la trame');
            }
            return await response.json();
        } catch (error) {
            console.error(`Erreur lors du chargement de la trame ${id}:`, error);
            toast.error('Impossible de charger la trame demandée');
            return null;
        }
    },

    // Sauvegarde des trames
    async saveTrame(trame: Trame): Promise<Trame | null> {
        try {
            const method = trame.id ? 'PUT' : 'POST';
            const url = trame.id ? API_ENDPOINTS.TRAME(trame.id) : API_ENDPOINTS.TRAMES;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trame),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la sauvegarde de la trame');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la trame:', error);
            toast.error('Impossible de sauvegarder la trame');
            return null;
        }
    },

    async deleteTrame(id: string): Promise<boolean> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAME(id), {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de la trame');
            }

            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression de la trame ${id}:`, error);
            toast.error('Impossible de supprimer la trame');
            return false;
        }
    },

    // Copie d'une trame existante
    async copyTrame(id: string, newName: string): Promise<Trame | null> {
        try {
            const trame = await this.getTrame(id);
            if (!trame) {
                throw new Error('Trame source introuvable');
            }

            const newTrame: Trame = {
                ...trame,
                id: generateId(),
                name: newName,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return await this.saveTrame(newTrame);
        } catch (error) {
            console.error(`Erreur lors de la copie de la trame ${id}:`, error);
            toast.error('Impossible de copier la trame');
            return null;
        }
    },

    // Validation des trames
    async validateTrame(trame: Trame): Promise<ValidationError[]> {
        try {
            const response = await fetch(API_ENDPOINTS.VALIDATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trame),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la validation de la trame');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la validation de la trame:', error);
            toast.error('Impossible de valider la trame');
            return [];
        }
    },

    // Validation locale des trames (côté client)
    validateTrameLocally(trame: Trame): ValidationError[] {
        const errors: ValidationError[] = [];

        // Vérification du chevauchement des périodes
        this.checkPeriodOverlaps(trame, errors);

        // Vérification des postes requis
        this.checkRequiredPosts(trame, errors);

        // Vérification des contraintes de temps
        this.checkTimeConstraints(trame, errors);

        // Vérification des contraintes légales
        this.checkLegalConstraints(trame, errors);

        return errors;
    },

    // Vérification du chevauchement des périodes
    checkPeriodOverlaps(trame: Trame, errors: ValidationError[]): void {
        const periods = trame.periods.filter(p => p.isActive);

        for (let i = 0; i < periods.length; i++) {
            const period1 = periods[i];
            const start1 = this.timeToMinutes(period1.startTime);
            const end1 = this.timeToMinutes(period1.endTime);

            for (let j = i + 1; j < periods.length; j++) {
                const period2 = periods[j];
                const start2 = this.timeToMinutes(period2.startTime);
                const end2 = this.timeToMinutes(period2.endTime);

                // Vérification du chevauchement
                if (
                    (start1 <= start2 && end1 > start2) ||
                    (start2 <= start1 && end2 > start1)
                ) {
                    errors.push({
                        type: 'PERIOD_OVERLAP',
                        message: `Chevauchement détecté entre "${period1.name}" et "${period2.name}"`,
                        periodId: period1.id,
                        details: {
                            period1: { id: period1.id, name: period1.name, start: period1.startTime, end: period1.endTime },
                            period2: { id: period2.id, name: period2.name, start: period2.startTime, end: period2.endTime },
                        }
                    });
                }
            }
        }
    },

    // Vérification des postes requis
    checkRequiredPosts(trame: Trame, errors: ValidationError[]): void {
        trame.periods.forEach(period => {
            if (!period.isActive) return;

            period.assignments.forEach(assignment => {
                if (!assignment.isActive) return;

                const requiredPosts = assignment.posts.filter(post => post.required);
                if (requiredPosts.length === 0) {
                    errors.push({
                        type: 'MISSING_REQUIRED_POST',
                        message: `L'affectation "${assignment.name}" dans la période "${period.name}" n'a pas de poste requis défini`,
                        periodId: period.id,
                        assignmentId: assignment.id
                    });
                }
            });
        });
    },

    // Vérification des contraintes de temps
    checkTimeConstraints(trame: Trame, errors: ValidationError[]): void {
        trame.periods.forEach(period => {
            if (!period.isActive) return;

            const startTime = this.timeToMinutes(period.startTime);
            const endTime = this.timeToMinutes(period.endTime);

            // Vérification de la validité des heures
            if (startTime >= endTime) {
                errors.push({
                    type: 'TIME_CONSTRAINT',
                    message: `L'heure de début doit être antérieure à l'heure de fin dans la période "${period.name}"`,
                    periodId: period.id
                });
            }

            // Vérification de la durée minimale
            const duration = endTime - startTime;
            if (duration < 60) { // Minimum 1h (60 minutes)
                errors.push({
                    type: 'TIME_CONSTRAINT',
                    message: `La durée de la période "${period.name}" est inférieure à 1 heure`,
                    periodId: period.id
                });
            }
        });
    },

    // Vérification des contraintes légales
    checkLegalConstraints(trame: Trame, errors: ValidationError[]): void {
        trame.periods.forEach(period => {
            if (!period.isActive) return;

            period.assignments.forEach(assignment => {
                if (!assignment.isActive) return;

                // Vérification de la durée maximale légale
                if (assignment.duration > 24) {
                    errors.push({
                        type: 'LEGAL_CONSTRAINT',
                        message: `L'affectation "${assignment.name}" dépasse la durée maximale légale de 24h`,
                        periodId: period.id,
                        assignmentId: assignment.id
                    });
                }
            });
        });
    },

    // Conversion de l'heure au format HH:MM en minutes
    timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    },

    // Génération de suggestions de trames
    async getSuggestions(serviceNeeds: any): Promise<Trame[]> {
        try {
            const response = await fetch(API_ENDPOINTS.SUGGESTIONS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serviceNeeds),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la génération des suggestions');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la génération des suggestions:', error);
            toast.error('Impossible de générer des suggestions');
            return [];
        }
    },

    // Export/Import de trames
    async exportTrame(id: string): Promise<any> {
        try {
            const response = await fetch(`${API_ENDPOINTS.EXPORT}/${id}`);
            if (!response.ok) {
                throw new Error('Erreur lors de l\'export de la trame');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `trame_${id}.json`;
            link.click();

            return true;
        } catch (error) {
            console.error(`Erreur lors de l'export de la trame ${id}:`, error);
            toast.error('Impossible d\'exporter la trame');
            return false;
        }
    },

    async importTrame(file: File): Promise<Trame | null> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(API_ENDPOINTS.IMPORT, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'import de la trame');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'import de la trame:', error);
            toast.error('Impossible d\'importer la trame');
            return null;
        }
    },

    // Export manuel (sans API, pour l'utilisation client-side)
    exportTrameToJSON(trame: Trame): void {
        const dataStr = JSON.stringify(trame, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `trame_${trame.name.replace(/\s+/g, '_').toLowerCase()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}; 