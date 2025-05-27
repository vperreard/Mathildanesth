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

export interface Attribution {
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
    attributions: Attribution[];
    isLocked: boolean;
}

export interface Tableau de service {
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
    TRAMES: '/api/tableaux de service',
    TRAME: (id: string) => `/api/tableaux de service/${id}`,
    SUGGESTIONS: '/api/tableaux de service/suggestions',
    VALIDATE: '/api/tableaux de service/validate',
    EXPORT: '/api/tableaux de service/export',
    IMPORT: '/api/tableaux de service/import',
};

// Service
export const TrameAffectationService = {
    // Méthodes CRUD pour les tests
    /**
     * Crée une nouvelle tableau de service d'garde/vacation
     * @param data Les données de la nouvelle tableau de service
     * @returns Les attributs de la tableau de service créée
     */
    async create(data: Omit<TrameAffectationAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrameAffectationAttributes> {
        try {
            const tableau de service = await TrameAffectation.create(data as any);
            // Dans les tests, le mock retourne directement les attributs, pas d'instance avec toJSON
            return tableau de service && typeof tableau de service.toJSON === 'function' ? tableau de service.toJSON() : tableau de service as TrameAffectationAttributes;
        } catch (error) {
            console.error('Erreur lors de la création de la tableau de service d\'garde/vacation:', error);
            throw new Error('Impossible de créer la tableau de service d\'garde/vacation');
        }
    },

    /**
     * Récupère toutes les tableaux de service d'garde/vacation
     * @returns Une liste d'attributs de tableaux de service d'garde/vacation
     */
    async findAll(): Promise<TrameAffectationAttributes[]> {
        try {
            const tableaux de service = await TrameAffectation.findAll({
                order: [['createdAt', 'DESC']],
            });
            // Dans les tests, le mock retourne directement un tableau d'attributs
            return Array.isArray(tableaux de service)
                ? tableaux de service.map(tableau de service => typeof tableau de service.toJSON === 'function' ? tableau de service.toJSON() : tableau de service as TrameAffectationAttributes)
                : tableaux de service as TrameAffectationAttributes[];
        } catch (error) {
            console.error('Erreur lors de la récupération des tableaux de service d\'garde/vacation:', error);
            throw new Error('Impossible de récupérer les tableaux de service d\'garde/vacation');
        }
    },

    /**
     * Récupère une tableau de service d'garde/vacation par son ID
     * @param id L'ID de la tableau de service à récupérer
     * @returns Les attributs de la tableau de service trouvée
     */
    async findById(id: string): Promise<TrameAffectationAttributes> {
        try {
            const tableau de service = await TrameAffectation.findByPk(id);
            if (!tableau de service) {
                throw new Error('Tableau de service d\'garde/vacation non trouvée');
            }
            // Dans les tests, le mock retourne directement les attributs
            return typeof tableau de service.toJSON === 'function' ? tableau de service.toJSON() : tableau de service as TrameAffectationAttributes;
        } catch (error) {
            if ((error as Error).message === 'Tableau de service d\'garde/vacation non trouvée') {
                throw error;
            }
            console.error(`Erreur lors de la récupération de la tableau de service d'garde/vacation ${id}:`, error);
            throw new Error('Impossible de récupérer la tableau de service d\'garde/vacation');
        }
    },

    /**
     * Met à jour une tableau de service d'garde/vacation existante
     * @param id L'ID de la tableau de service à mettre à jour
     * @param data Les nouvelles données de la tableau de service
     * @returns Les attributs de la tableau de service mise à jour
     */
    async update(id: string, data: Partial<TrameAffectationAttributes>): Promise<TrameAffectationAttributes> {
        try {
            const [updatedRowsCount] = await TrameAffectation.update(data, {
                where: { id }
            });

            if (updatedRowsCount === 0) {
                throw new Error('Tableau de service d\'garde/vacation non trouvée');
            }

            return this.findById(id);
        } catch (error) {
            if ((error as Error).message === 'Tableau de service d\'garde/vacation non trouvée') {
                throw error;
            }
            console.error(`Erreur lors de la mise à jour de la tableau de service d'garde/vacation ${id}:`, error);
            throw new Error('Impossible de mettre à jour la tableau de service d\'garde/vacation');
        }
    },

    /**
     * Supprime une tableau de service d'garde/vacation
     * @param id L'ID de la tableau de service à supprimer
     * @returns true si la suppression a réussi
     */
    async delete(id: string): Promise<boolean> {
        try {
            const deletedRowsCount = await TrameAffectation.destroy({
                where: { id }
            });

            if (deletedRowsCount === 0) {
                throw new Error('Tableau de service d\'garde/vacation non trouvée');
            }

            return true;
        } catch (error) {
            if ((error as Error).message === 'Tableau de service d\'garde/vacation non trouvée') {
                throw error;
            }
            console.error(`Erreur lors de la suppression de la tableau de service d'garde/vacation ${id}:`, error);
            throw new Error('Impossible de supprimer la tableau de service d\'garde/vacation');
        }
    },

    /**
     * Récupère les tableaux de service d'garde/vacation d'un utilisateur spécifique
     * @param userId L'ID de l'utilisateur
     * @returns Une liste d'attributs de tableaux de service d'garde/vacation
     */
    async findByUserId(userId: number): Promise<TrameAffectationAttributes[]> {
        try {
            const tableaux de service = await TrameAffectation.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
            });
            // Dans les tests, le mock retourne directement un tableau d'attributs
            return Array.isArray(tableaux de service)
                ? tableaux de service.map(tableau de service => typeof tableau de service.toJSON === 'function' ? tableau de service.toJSON() : tableau de service as TrameAffectationAttributes)
                : tableaux de service as TrameAffectationAttributes[];
        } catch (error) {
            console.error(`Erreur lors de la récupération des tableaux de service d'garde/vacation de l'utilisateur ${userId}:`, error);
            throw new Error('Impossible de récupérer les tableaux de service d\'garde/vacation de l\'utilisateur');
        }
    },

    // Chargement des tableaux de service
    async getAllTrames(): Promise<Tableau de service[]> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAMES);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des tableaux de service');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur lors du chargement des tableaux de service:', error);
            toast.error('Impossible de charger les tableaux de service');
            return [];
        }
    },

    async getTrame(id: string): Promise<Tableau de service | null> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAME(id));
            if (!response.ok) {
                throw new Error('Erreur lors du chargement de la tableau de service');
            }
            return await response.json();
        } catch (error) {
            console.error(`Erreur lors du chargement de la tableau de service ${id}:`, error);
            toast.error('Impossible de charger la tableau de service demandée');
            return null;
        }
    },

    // Sauvegarde des tableaux de service
    async saveTrame(tableau de service: Tableau de service): Promise<Tableau de service | null> {
        try {
            const method = tableau de service.id ? 'PUT' : 'POST';
            const url = tableau de service.id ? API_ENDPOINTS.TRAME(tableau de service.id) : API_ENDPOINTS.TRAMES;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tableau de service),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la sauvegarde de la tableau de service');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la tableau de service:', error);
            toast.error('Impossible de sauvegarder la tableau de service');
            return null;
        }
    },

    async deleteTrame(id: string): Promise<boolean> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAME(id), {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de la tableau de service');
            }

            return true;
        } catch (error) {
            console.error(`Erreur lors de la suppression de la tableau de service ${id}:`, error);
            toast.error('Impossible de supprimer la tableau de service');
            return false;
        }
    },

    // Copie d'une tableau de service existante
    async copyTrame(id: string, newName: string): Promise<Tableau de service | null> {
        try {
            const tableau de service = await this.getTrame(id);
            if (!tableau de service) {
                throw new Error('Tableau de service source introuvable');
            }

            const newTrame: Tableau de service = {
                ...tableau de service,
                id: generateId(),
                name: newName,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return await this.saveTrame(newTrame);
        } catch (error) {
            console.error(`Erreur lors de la copie de la tableau de service ${id}:`, error);
            toast.error('Impossible de copier la tableau de service');
            return null;
        }
    },

    // Validation des tableaux de service
    async validateTrame(tableau de service: Tableau de service): Promise<ValidationError[]> {
        try {
            const response = await fetch(API_ENDPOINTS.VALIDATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tableau de service),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la validation de la tableau de service');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de la validation de la tableau de service:', error);
            toast.error('Impossible de valider la tableau de service');
            return [];
        }
    },

    // Validation locale des tableaux de service (côté client)
    validateTrameLocally(tableau de service: Tableau de service): ValidationError[] {
        const errors: ValidationError[] = [];

        // Vérification du chevauchement des périodes
        this.checkPeriodOverlaps(tableau de service, errors);

        // Vérification des postes requis
        this.checkRequiredPosts(tableau de service, errors);

        // Vérification des contraintes de temps
        this.checkTimeConstraints(tableau de service, errors);

        // Vérification des contraintes légales
        this.checkLegalConstraints(tableau de service, errors);

        return errors;
    },

    // Vérification du chevauchement des périodes
    checkPeriodOverlaps(tableau de service: Tableau de service, errors: ValidationError[]): void {
        const periods = tableau de service.periods.filter(p => p.isActive);

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
    checkRequiredPosts(tableau de service: Tableau de service, errors: ValidationError[]): void {
        tableau de service.periods.forEach(period => {
            if (!period.isActive) return;

            period.attributions.forEach(attribution => {
                if (!attribution.isActive) return;

                const requiredPosts = attribution.posts.filter(post => post.required);
                if (requiredPosts.length === 0) {
                    errors.push({
                        type: 'MISSING_REQUIRED_POST',
                        message: `L'garde/vacation "${attribution.name}" dans la période "${period.name}" n'a pas de poste requis défini`,
                        periodId: period.id,
                        assignmentId: attribution.id
                    });
                }
            });
        });
    },

    // Vérification des contraintes de temps
    checkTimeConstraints(tableau de service: Tableau de service, errors: ValidationError[]): void {
        tableau de service.periods.forEach(period => {
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
    checkLegalConstraints(tableau de service: Tableau de service, errors: ValidationError[]): void {
        tableau de service.periods.forEach(period => {
            if (!period.isActive) return;

            period.attributions.forEach(attribution => {
                if (!attribution.isActive) return;

                // Vérification de la durée maximale légale
                if (attribution.duration > 24) {
                    errors.push({
                        type: 'LEGAL_CONSTRAINT',
                        message: `L'garde/vacation "${attribution.name}" dépasse la durée maximale légale de 24h`,
                        periodId: period.id,
                        assignmentId: attribution.id
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

    // Génération de suggestions de tableaux de service
    async getSuggestions(serviceNeeds: any): Promise<Tableau de service[]> {
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

    // Export/Import de tableaux de service
    async exportTrame(id: string): Promise<any> {
        try {
            const response = await fetch(`${API_ENDPOINTS.EXPORT}/${id}`);
            if (!response.ok) {
                throw new Error('Erreur lors de l\'export de la tableau de service');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `trame_${id}.json`;
            link.click();

            return true;
        } catch (error) {
            console.error(`Erreur lors de l'export de la tableau de service ${id}:`, error);
            toast.error('Impossible d\'exporter la tableau de service');
            return false;
        }
    },

    async importTrame(file: File): Promise<Tableau de service | null> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(API_ENDPOINTS.IMPORT, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'import de la tableau de service');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur lors de l\'import de la tableau de service:', error);
            toast.error('Impossible d\'importer la tableau de service');
            return null;
        }
    },

    // Export manuel (sans API, pour l'utilisation client-side)
    exportTrameToJSON(tableau de service: Tableau de service): void {
        const dataStr = JSON.stringify(tableau de service, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `trame_${tableau de service.name.replace(/\s+/g, '_').toLowerCase()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}; 