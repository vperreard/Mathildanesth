import { toast } from 'react-hot-toast';
import { logger } from "../lib/logger";
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

export interface TrameModele {
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
    details?: unknown;
}

// Helpers
const generateId = (): string => {
    return Math.random().toString(36).substring(2, 9);
};

// API Endpoints
const API_ENDPOINTS = {
    TRAMES: '/api/trameModeles',
    TRAME: (id: string) => `/api/trameModeles/${id}`,
    SUGGESTIONS: '/api/trameModeles/suggestions',
    VALIDATE: '/api/trameModeles/validate',
    EXPORT: '/api/trameModeles/export',
    IMPORT: '/api/trameModeles/import',
};

// Service
export const TrameAffectationService = {
    // Méthodes CRUD pour les tests
    /**
     * Crée une nouvelle trameModele d'garde/vacation
     * @param data Les données de la nouvelle trameModele
     * @returns Les attributs de la trameModele créée
     */
    async create(data: Omit<TrameAffectationAttributes, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrameAffectationAttributes> {
        try {
            const trameModele = await TrameAffectation.create(data as any);
            // Dans les tests, le mock retourne directement les attributs, pas d'instance avec toJSON
            return trameModele && typeof trameModele.toJSON === 'function' ? trameModele.toJSON() : trameModele as TrameAffectationAttributes;
        } catch (error: unknown) {
            logger.error('Erreur lors de la création de la trameModele d\'affectation:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de créer la trameModele d\'garde/vacation');
        }
    },

    /**
     * Récupère toutes les trameModeles d'garde/vacation
     * @returns Une liste d'attributs de trameModeles d'garde/vacation
     */
    async findAll(): Promise<TrameAffectationAttributes[]> {
        try {
            const trameModeles = await TrameAffectation.findAll({
                order: [['createdAt', 'DESC']],
            });
            // Dans les tests, le mock retourne directement un tableau d'attributs
            return Array.isArray(trameModeles)
                ? trameModeles.map(trameModele => typeof trameModele.toJSON === 'function' ? trameModele.toJSON() : trameModele as TrameAffectationAttributes)
                : trameModeles as TrameAffectationAttributes[];
        } catch (error: unknown) {
            logger.error('Erreur lors de la récupération des trameModeles d\'affectation:', error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de récupérer les trameModeles d\'garde/vacation');
        }
    },

    /**
     * Récupère une trameModele d'garde/vacation par son ID
     * @param id L'ID de la trameModele à récupérer
     * @returns Les attributs de la trameModele trouvée
     */
    async findById(id: string): Promise<TrameAffectationAttributes> {
        try {
            const trameModele = await TrameAffectation.findByPk(id);
            if (!trameModele) {
                throw new Error('TrameModele d\'garde/vacation non trouvée');
            }
            // Dans les tests, le mock retourne directement les attributs
            return typeof trameModele.toJSON === 'function' ? trameModele.toJSON() : trameModele as TrameAffectationAttributes;
        } catch (error: unknown) {
            if ((error as Error).message === 'TrameModele d\'garde/vacation non trouvée') {
                throw error;
            }
            logger.error(`Erreur lors de la récupération de la trameModele d'garde/vacation ${id}:`, error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de récupérer la trameModele d\'garde/vacation');
        }
    },

    /**
     * Met à jour une trameModele d'garde/vacation existante
     * @param id L'ID de la trameModele à mettre à jour
     * @param data Les nouvelles données de la trameModele
     * @returns Les attributs de la trameModele mise à jour
     */
    async update(id: string, data: Partial<TrameAffectationAttributes>): Promise<TrameAffectationAttributes> {
        try {
            const [updatedRowsCount] = await TrameAffectation.update(data, {
                where: { id }
            });

            if (updatedRowsCount === 0) {
                throw new Error('TrameModele d\'garde/vacation non trouvée');
            }

            return this.findById(id);
        } catch (error: unknown) {
            if ((error as Error).message === 'TrameModele d\'garde/vacation non trouvée') {
                throw error;
            }
            logger.error(`Erreur lors de la mise à jour de la trameModele d'garde/vacation ${id}:`, error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de mettre à jour la trameModele d\'garde/vacation');
        }
    },

    /**
     * Supprime une trameModele d'garde/vacation
     * @param id L'ID de la trameModele à supprimer
     * @returns true si la suppression a réussi
     */
    async delete(id: string): Promise<boolean> {
        try {
            const deletedRowsCount = await TrameAffectation.destroy({
                where: { id }
            });

            if (deletedRowsCount === 0) {
                throw new Error('TrameModele d\'garde/vacation non trouvée');
            }

            return true;
        } catch (error: unknown) {
            if ((error as Error).message === 'TrameModele d\'garde/vacation non trouvée') {
                throw error;
            }
            logger.error(`Erreur lors de la suppression de la trameModele d'garde/vacation ${id}:`, error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de supprimer la trameModele d\'garde/vacation');
        }
    },

    /**
     * Récupère les trameModeles d'garde/vacation d'un utilisateur spécifique
     * @param userId L'ID de l'utilisateur
     * @returns Une liste d'attributs de trameModeles d'garde/vacation
     */
    async findByUserId(userId: number): Promise<TrameAffectationAttributes[]> {
        try {
            const trameModeles = await TrameAffectation.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
            });
            // Dans les tests, le mock retourne directement un tableau d'attributs
            return Array.isArray(trameModeles)
                ? trameModeles.map(trameModele => typeof trameModele.toJSON === 'function' ? trameModele.toJSON() : trameModele as TrameAffectationAttributes)
                : trameModeles as TrameAffectationAttributes[];
        } catch (error: unknown) {
            logger.error(`Erreur lors de la récupération des trameModeles d'garde/vacation de l'utilisateur ${userId}:`, error instanceof Error ? error : new Error(String(error)));
            throw new Error('Impossible de récupérer les trameModeles d\'garde/vacation de l\'utilisateur');
        }
    },

    // Chargement des trameModeles
    async getAllTrames(): Promise<TrameModele[]> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAMES);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des trameModeles');
            }
            return await response.json();
        } catch (error: unknown) {
            logger.error('Erreur lors du chargement des trames:', error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible de charger les trameModeles');
            return [];
        }
    },

    async getTrame(id: string): Promise<TrameModele | null> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAME(id));
            if (!response.ok) {
                throw new Error('Erreur lors du chargement de la trameModele');
            }
            return await response.json();
        } catch (error: unknown) {
            logger.error(`Erreur lors du chargement de la trameModele ${id}:`, error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible de charger la trameModele demandée');
            return null;
        }
    },

    // Sauvegarde des trameModeles
    async saveTrame(trameModele: TrameModele): Promise<TrameModele | null> {
        try {
            const method = trameModele.id ? 'PUT' : 'POST';
            const url = trameModele.id ? API_ENDPOINTS.TRAME(trameModele.id) : API_ENDPOINTS.TRAMES;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trameModele),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la sauvegarde de la trameModele');
            }

            return await response.json();
        } catch (error: unknown) {
            logger.error('Erreur lors de la sauvegarde de la tableau de service:', error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible de sauvegarder la trameModele');
            return null;
        }
    },

    async deleteTrame(id: string): Promise<boolean> {
        try {
            const response = await fetch(API_ENDPOINTS.TRAME(id), {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression de la trameModele');
            }

            return true;
        } catch (error: unknown) {
            logger.error(`Erreur lors de la suppression de la trameModele ${id}:`, error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible de supprimer la trameModele');
            return false;
        }
    },

    // Copie d'une trameModele existante
    async copyTrame(id: string, newName: string): Promise<TrameModele | null> {
        try {
            const trameModele = await this.getTrame(id);
            if (!trameModele) {
                throw new Error('TrameModele source introuvable');
            }

            const newTrame: TrameModele = {
                ...trame,
                id: generateId(),
                name: newName,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return await this.saveTrame(newTrame);
        } catch (error: unknown) {
            logger.error(`Erreur lors de la copie de la trameModele ${id}:`, error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible de copier la trameModele');
            return null;
        }
    },

    // Validation des trameModeles
    async validateTrame(trameModele: TrameModele): Promise<ValidationError[]> {
        try {
            const response = await fetch(API_ENDPOINTS.VALIDATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trameModele),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la validation de la trameModele');
            }

            return await response.json();
        } catch (error: unknown) {
            logger.error('Erreur lors de la validation de la tableau de service:', error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible de valider la trameModele');
            return [];
        }
    },

    // Validation locale des trameModeles (côté client)
    validateTrameLocally(trameModele: TrameModele): ValidationError[] {
        const errors: ValidationError[] = [];

        // Vérification du chevauchement des périodes
        this.checkPeriodOverlaps(trameModele, errors);

        // Vérification des postes requis
        this.checkRequiredPosts(trameModele, errors);

        // Vérification des contraintes de temps
        this.checkTimeConstraints(trameModele, errors);

        // Vérification des contraintes légales
        this.checkLegalConstraints(trameModele, errors);

        return errors;
    },

    // Vérification du chevauchement des périodes
    checkPeriodOverlaps(trameModele: TrameModele, errors: ValidationError[]): void {
        const periods = trameModele.periods.filter(p => p.isActive);

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
    checkRequiredPosts(trameModele: TrameModele, errors: ValidationError[]): void {
        trameModele.periods.forEach(period => {
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
    checkTimeConstraints(trameModele: TrameModele, errors: ValidationError[]): void {
        trameModele.periods.forEach(period => {
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
    checkLegalConstraints(trameModele: TrameModele, errors: ValidationError[]): void {
        trameModele.periods.forEach(period => {
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

    // Génération de suggestions de trameModeles
    async getSuggestions(serviceNeeds: unknown): Promise<TrameModele[]> {
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
        } catch (error: unknown) {
            logger.error('Erreur lors de la génération des suggestions:', error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible de générer des suggestions');
            return [];
        }
    },

    // Export/Import de trameModeles
    async exportTrame(id: string): Promise<unknown> {
        try {
            const response = await fetch(`${API_ENDPOINTS.EXPORT}/${id}`);
            if (!response.ok) {
                throw new Error('Erreur lors de l\'export de la trameModele');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `trame_${id}.json`;
            link.click();

            return true;
        } catch (error: unknown) {
            logger.error(`Erreur lors de l'export de la trameModele ${id}:`, error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible d\'exporter la trameModele');
            return false;
        }
    },

    async importTrame(file: File): Promise<TrameModele | null> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(API_ENDPOINTS.IMPORT, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'import de la trameModele');
            }

            return await response.json();
        } catch (error: unknown) {
            logger.error('Erreur lors de l\'import de la tableau de service:', error instanceof Error ? error : new Error(String(error)));
            toast.error('Impossible d\'importer la trameModele');
            return null;
        }
    },

    // Export manuel (sans API, pour l'utilisation client-side)
    exportTrameToJSON(trameModele: TrameModele): void {
        const dataStr = JSON.stringify(trameModele, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `trame_${trameModele.name.replace(/\s+/g, '_').toLowerCase()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}; 