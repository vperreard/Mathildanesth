/**
 * TrameAffectation Model - Prisma Implementation (Phase 3)
 * Remplace le modèle Sequelize par Prisma
 */

import { TrameAffectation } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Types pour compatibilité
export type PeriodeType = 'HEBDOMADAIRE' | 'BI_HEBDOMADAIRE' | 'MENSUEL';

export interface TrameAffectationAttributes extends TrameAffectation {
    // Interface compatible avec Sequelize
}

/**
 * Classe TrameAffectation compatible avec l'ancienne interface Sequelize
 */
export class TrameAffectationPrisma {
    public id!: string;
    public userId!: number;
    public periodeType!: string;
    public dateDebut!: Date;
    public dateFin!: Date;
    public motif!: string;
    public isRecurrent!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    constructor(data: TrameAffectation) {
        Object.assign(this, data);
    }

    /**
     * Sauvegarde les modifications
     */
    public async save(): Promise<TrameAffectationPrisma> {
        const updated = await prisma.trameAffectation.update({
            where: { id: this.id },
            data: {
                userId: this.userId,
                periodeType: this.periodeType,
                dateDebut: this.dateDebut,
                dateFin: this.dateFin,
                motif: this.motif,
                isRecurrent: this.isRecurrent
            }
        });
        
        Object.assign(this, updated);
        return this;
    }

    /**
     * Recharge les données depuis la base
     */
    public async reload(): Promise<TrameAffectationPrisma> {
        const fresh = await prisma.trameAffectation.findUnique({
            where: { id: this.id }
        });
        if (fresh) {
            Object.assign(this, fresh);
        }
        return this;
    }

    /**
     * Supprime l'enregistrement
     */
    public async destroy(): Promise<void> {
        await prisma.trameAffectation.delete({
            where: { id: this.id }
        });
    }

    // === MÉTHODES STATIQUES COMPATIBLES SEQUELIZE ===

    /**
     * Trouve une trame par critères
     */
    static async findOne(where: any): Promise<TrameAffectationPrisma | null> {
        let trame = null;
        
        if (where.id) {
            trame = await prisma.trameAffectation.findUnique({
                where: { id: where.id }
            });
        } else if (where.userId) {
            trame = await prisma.trameAffectation.findFirst({
                where: { userId: where.userId }
            });
        } else {
            trame = await prisma.trameAffectation.findFirst({
                where
            });
        }

        return trame ? new TrameAffectationPrisma(trame) : null;
    }

    /**
     * Trouve toutes les trames selon critères
     */
    static async findAll(options: any = {}): Promise<TrameAffectationPrisma[]> {
        const where: any = {};
        
        if (options.where) {
            Object.assign(where, options.where);
        }

        const queryOptions: any = { where };
        
        if (options.limit) {
            queryOptions.take = options.limit;
        }
        
        if (options.offset) {
            queryOptions.skip = options.offset;
        }
        
        if (options.order) {
            queryOptions.orderBy = options.order.map((orderItem: any) => {
                if (Array.isArray(orderItem)) {
                    return { [orderItem[0]]: orderItem[1].toLowerCase() };
                }
                return { [orderItem]: 'asc' };
            });
        }

        const trames = await prisma.trameAffectation.findMany(queryOptions);
        return trames.map(trame => new TrameAffectationPrisma(trame));
    }

    /**
     * Crée une nouvelle trame
     */
    static async create(data: any): Promise<TrameAffectationPrisma> {
        const created = await prisma.trameAffectation.create({
            data: {
                userId: data.userId,
                periodeType: data.periodeType,
                dateDebut: new Date(data.dateDebut),
                dateFin: new Date(data.dateFin),
                motif: data.motif,
                isRecurrent: data.isRecurrent || false
            }
        });

        return new TrameAffectationPrisma(created);
    }

    /**
     * Met à jour des trames
     */
    static async update(data: any, options: any): Promise<[number, TrameAffectationPrisma[]]> {
        if (!options.where) {
            throw new Error('Critères de mise à jour requis');
        }

        // Pour une mise à jour simple par ID
        if (options.where.id) {
            const updated = await prisma.trameAffectation.update({
                where: { id: options.where.id },
                data
            });
            return [1, [new TrameAffectationPrisma(updated)]];
        }

        // Pour une mise à jour multiple, on simule le comportement Sequelize
        const existing = await prisma.trameAffectation.findMany({
            where: options.where
        });

        const updatePromises = existing.map(trame =>
            prisma.trameAffectation.update({
                where: { id: trame.id },
                data
            })
        );

        const updated = await Promise.all(updatePromises);
        return [updated.length, updated.map(trame => new TrameAffectationPrisma(trame))];
    }

    /**
     * Supprime des trames
     */
    static async destroy(options: any): Promise<number> {
        if (!options.where) {
            throw new Error('Critères de suppression requis');
        }

        if (options.where.id) {
            await prisma.trameAffectation.delete({
                where: { id: options.where.id }
            });
            return 1;
        }

        const result = await prisma.trameAffectation.deleteMany({
            where: options.where
        });

        return result.count;
    }

    /**
     * Compte les trames
     */
    static async count(options: any = {}): Promise<number> {
        const where = options.where || {};
        return prisma.trameAffectation.count({ where });
    }

    /**
     * Trouve par clé primaire
     */
    static async findByPk(id: string): Promise<TrameAffectationPrisma | null> {
        const trame = await prisma.trameAffectation.findUnique({
            where: { id }
        });
        return trame ? new TrameAffectationPrisma(trame) : null;
    }

    /**
     * Trouve toutes les trames pour un utilisateur
     */
    static async findByUserId(userId: number): Promise<TrameAffectationPrisma[]> {
        const trames = await prisma.trameAffectation.findMany({
            where: { userId },
            orderBy: { dateDebut: 'asc' }
        });
        return trames.map(trame => new TrameAffectationPrisma(trame));
    }

    /**
     * Trouve les trames par période
     */
    static async findByPeriod(dateDebut: Date, dateFin: Date): Promise<TrameAffectationPrisma[]> {
        const trames = await prisma.trameAffectation.findMany({
            where: {
                AND: [
                    { dateDebut: { lte: dateFin } },
                    { dateFin: { gte: dateDebut } }
                ]
            },
            orderBy: { dateDebut: 'asc' }
        });
        return trames.map(trame => new TrameAffectationPrisma(trame));
    }

    /**
     * Trouve les trames récurrentes
     */
    static async findRecurrent(): Promise<TrameAffectationPrisma[]> {
        const trames = await prisma.trameAffectation.findMany({
            where: { isRecurrent: true },
            orderBy: { dateDebut: 'asc' }
        });
        return trames.map(trame => new TrameAffectationPrisma(trame));
    }
}

// Export pour compatibilité
export default TrameAffectationPrisma;
export { TrameAffectationPrisma as TrameAffectation };