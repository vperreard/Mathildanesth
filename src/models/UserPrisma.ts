/**
 * User Model - Prisma Implementation (Phase 3)
 * Remplace complètement le modèle Sequelize par Prisma
 */

import { User, Role } from '@prisma/client';
import { UserServicePrisma } from '@/services/userService-prisma';

// Types compatibles avec l'ancienne interface
export type UserRole = Role;

export interface UserAttributes extends User {
    // Mapping pour compatibilité
    firstName?: string;
    lastName?: string;
}

/**
 * Classe User compatible avec l'ancienne interface Sequelize
 * Utilise en interne UserServicePrisma
 */
export class UserPrisma {
    public id!: number;
    public email!: string;
    public password!: string;
    public nom!: string;
    public prenom!: string;
    public login!: string;
    public role!: Role;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Propriétés de compatibilité
    public get firstName(): string {
        return this.prenom;
    }

    public get lastName(): string {
        return this.nom;
    }

    constructor(data: User) {
        Object.assign(this, data);
    }

    /**
     * Compare le mot de passe avec le hash stocké
     */
    public async comparePassword(candidatePassword: string): Promise<boolean> {
        return UserServicePrisma.verifyPassword(this, candidatePassword);
    }

    /**
     * Sauvegarde les modifications
     */
    public async save(): Promise<UserPrisma> {
        const updated = await UserServicePrisma.updateUser(this.id, {
            nom: this.nom,
            prenom: this.prenom,
            login: this.login,
            email: this.email,
            role: this.role,
            isActive: this.isActive
        });
        
        Object.assign(this, updated);
        return this;
    }

    /**
     * Recharge les données depuis la base
     */
    public async reload(): Promise<UserPrisma> {
        const fresh = await UserServicePrisma.findUserById(this.id);
        if (fresh) {
            Object.assign(this, fresh);
        }
        return this;
    }

    // === MÉTHODES STATIQUES COMPATIBLES SEQUELIZE ===

    /**
     * Trouve un utilisateur par critères
     */
    static async findOne(where: unknown): Promise<UserPrisma | null> {
        let user = null;
        
        if (where.login) {
            user = await UserServicePrisma.findUserByLogin(where.login);
        } else if (where.email) {
            user = await UserServicePrisma.findUserByEmail(where.email);
        } else if (where.id) {
            user = await UserServicePrisma.findUserById(where.id);
        }

        return user ? new UserPrisma(user) : null;
    }

    /**
     * Trouve tous les utilisateurs selon critères
     */
    static async findAll(options: any = {}): Promise<UserPrisma[]> {
        const filters: any = {};

        if (options.where) {
            if (options.where.isActive !== undefined) {
                filters.isActive = options.where.isActive;
            }
            if (options.where.role) {
                filters.role = options.where.role;
            }
        }

        if (options.limit) {
            filters.limit = options.limit;
        }

        const result = await UserServicePrisma.searchUsers(filters);
        return result.users.map(user => new UserPrisma(user));
    }

    /**
     * Crée un nouvel utilisateur
     */
    static async create(userData: unknown): Promise<UserPrisma> {
        const prismaData = {
            nom: userData.lastName || userData.nom,
            prenom: userData.firstName || userData.prenom,
            login: userData.login,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            departmentId: userData.departmentId,
            siteIds: userData.siteIds
        };

        const created = await UserServicePrisma.createUser(prismaData);
        return new UserPrisma(created);
    }

    /**
     * Met à jour des utilisateurs
     */
    static async update(userData: unknown, options: unknown): Promise<[number, UserPrisma[]]> {
        if (!options.where?.id) {
            throw new Error('ID utilisateur requis pour la mise à jour');
        }

        const updateData = {
            nom: userData.lastName || userData.nom,
            prenom: userData.firstName || userData.prenom,
            login: userData.login,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            departmentId: userData.departmentId,
            siteIds: userData.siteIds,
            isActive: userData.isActive
        };

        const updated = await UserServicePrisma.updateUser(options.where.id, updateData);
        return [1, [new UserPrisma(updated)]];
    }

    /**
     * Supprime des utilisateurs
     */
    static async destroy(options: unknown): Promise<number> {
        if (!options.where?.id) {
            throw new Error('ID utilisateur requis pour la suppression');
        }

        const success = await UserServicePrisma.deleteUser(options.where.id);
        return success ? 1 : 0;
    }

    /**
     * Compte les utilisateurs
     */
    static async count(options: any = {}): Promise<number> {
        const filters: any = {};
        
        if (options.where) {
            if (options.where.isActive !== undefined) {
                filters.isActive = options.where.isActive;
            }
            if (options.where.role) {
                filters.role = options.where.role;
            }
        }

        const result = await UserServicePrisma.searchUsers(filters);
        return result.total;
    }

    /**
     * Trouve par clé primaire
     */
    static async findByPk(id: number): Promise<UserPrisma | null> {
        const user = await UserServicePrisma.findUserById(id);
        return user ? new UserPrisma(user) : null;
    }
}

// Export pour compatibilité
export default UserPrisma;
export { UserPrisma as User };