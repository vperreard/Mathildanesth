/**
 * Service Utilisateur - Migration vers Prisma (Phase 3)
 * Remplace l'ancien service Sequelize par la version Prisma optimisée
 */

// Import du nouveau service Prisma
import {
    UserServicePrisma,
    UserWithProfile,
    CreateUserInput,
    UpdateUserInput,
    UserSearchFilters,
    cleanupPrisma
} from './userService-prisma';

// Import types séparément pour les re-exports
import type {
    UserWithProfile as PrismaUserWithProfile,
    CreateUserInput as PrismaCreateUserInput,
    UpdateUserInput as PrismaUpdateUserInput,
    UserSearchFilters as PrismaUserSearchFilters
} from './userService-prisma';

// Types compatibles avec l'ancienne interface
export type {
    PrismaUserWithProfile as UserAttributes,
    PrismaCreateUserInput,
    PrismaUpdateUserInput,
    PrismaUserSearchFilters,
    UserWithProfile
};

/**
 * Service Utilisateur Unifié - Wrapper vers Prisma
 * Maintient la compatibilité avec l'ancienne interface Sequelize
 */
export class UserService {

    /**
     * Créer un nouvel utilisateur
     */
    static async createUser(userData: PrismaCreateUserInput): Promise<PrismaUserWithProfile> {
        return UserServicePrisma.createUser(userData);
    }

    /**
     * Trouver un utilisateur par ID
     */
    static async findUserById(userId: number): Promise<PrismaUserWithProfile | null> {
        return UserServicePrisma.findUserById(userId);
    }

    /**
     * Trouver un utilisateur par login
     */
    static async findUserByLogin(login: string) {
        return UserServicePrisma.findUserByLogin(login);
    }

    /**
     * Trouver un utilisateur par email
     */
    static async findUserByEmail(email: string) {
        return UserServicePrisma.findUserByEmail(email);
    }

    /**
     * Mettre à jour un utilisateur
     */
    static async updateUser(userId: number, userData: PrismaUpdateUserInput): Promise<PrismaUserWithProfile> {
        return UserServicePrisma.updateUser(userId, userData);
    }

    /**
     * Supprimer un utilisateur (soft delete)
     */
    static async deleteUser(userId: number): Promise<boolean> {
        return UserServicePrisma.deleteUser(userId);
    }

    /**
     * Supprimer définitivement un utilisateur
     */
    static async hardDeleteUser(userId: number): Promise<boolean> {
        return UserServicePrisma.hardDeleteUser(userId);
    }

    /**
     * Rechercher des utilisateurs avec filtres
     */
    static async searchUsers(filters: PrismaUserSearchFilters = {}) {
        return UserServicePrisma.searchUsers(filters);
    }

    /**
     * Lister tous les utilisateurs actifs
     */
    static async getAllActiveUsers(): Promise<PrismaUserWithProfile[]> {
        return UserServicePrisma.getAllActiveUsers();
    }

    /**
     * Vérifier le mot de passe d'un utilisateur
     */
    static async verifyPassword(user: unknown, candidatePassword: string): Promise<boolean> {
        return UserServicePrisma.verifyPassword(user, candidatePassword);
    }

    /**
     * Changer le mot de passe d'un utilisateur
     */
    static async changePassword(userId: number, newPassword: string): Promise<boolean> {
        return UserServicePrisma.changePassword(userId, newPassword);
    }

    /**
     * Obtenir les statistiques des utilisateurs
     */
    static async getUserStats() {
        return UserServicePrisma.getUserStats();
    }

    // === MÉTHODES DE COMPATIBILITÉ SEQUELIZE ===

    /**
     * @deprecated Utilisez findUserByLogin à la place
     */
    static async findOne(where: unknown) {
        if (where.login) {
            return this.findUserByLogin(where.login);
        }
        if (where.email) {
            return this.findUserByEmail(where.email);
        }
        if (where.id) {
            return this.findUserById(where.id);
        }
        throw new Error('Critère de recherche non supporté dans la migration Prisma');
    }

    /**
     * @deprecated Utilisez searchUsers à la place
     */
    static async findAll(options: any = {}) {
        const filters: PrismaUserSearchFilters = {};

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

        const result = await this.searchUsers(filters);
        return result.users;
    }

    /**
     * @deprecated Utilisez createUser à la place
     */
    static async create(userData: unknown) {
        // Mapping des champs Sequelize vers Prisma
        const prismaData: PrismaCreateUserInput = {
            nom: userData.lastName || userData.nom,
            prenom: userData.firstName || userData.prenom,
            login: userData.login,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            departmentId: userData.departmentId,
            siteIds: userData.siteIds
        };

        return this.createUser(prismaData);
    }

    /**
     * @deprecated Utilisez updateUser à la place
     */
    static async update(userData: unknown, options: unknown) {
        if (!options.where?.id) {
            throw new Error('ID utilisateur requis pour la mise à jour');
        }

        const updateData: PrismaUpdateUserInput = {
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

        return this.updateUser(options.where.id, updateData);
    }

    /**
     * @deprecated Utilisez deleteUser à la place
     */
    static async destroy(options: unknown) {
        if (!options.where?.id) {
            throw new Error('ID utilisateur requis pour la suppression');
        }

        return this.deleteUser(options.where.id);
    }
}

// Export du cleanup Prisma
export { cleanupPrisma };

// Export par défaut pour compatibilité
export default UserService; 