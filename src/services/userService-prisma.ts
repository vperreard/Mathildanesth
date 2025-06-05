/**
 * Service Utilisateur avec Prisma - Migration Phase 2
 * Remplace complètement Sequelize par Prisma pour la compatibilité Edge Runtime
 */

import { PrismaClient, User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logError } from './errorLoggingService';
import { ErrorSeverity, ErrorDetails } from '@/hooks/useErrorHandler';

// Instance Prisma partagée
const prisma = new PrismaClient();

// Types étendus
export interface UserWithProfile extends User {
  department?: {
    id: string;
    name: string;
  } | null;
  sites?: Array<{
    id: string;
    name: string;
  }>;
}

export interface CreateUserInput {
  nom: string;
  prenom: string;
  login: string;
  email: string;
  password: string;
  role: Role;
  departmentId?: string;
  siteIds?: string[];
}

export interface UpdateUserInput {
  nom?: string;
  prenom?: string;
  login?: string;
  email?: string;
  password?: string;
  role?: Role;
  departmentId?: string;
  siteIds?: string[];
  isActive?: boolean;
}

export interface UserSearchFilters {
  search?: string;
  role?: Role;
  department?: string;
  site?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Gestionnaire d'erreurs spécifique
const buildUserServiceErrorDetails = (
  error: any,
  context?: Record<string, any>
): Omit<ErrorDetails, 'timestamp' | 'retry'> => {
  const isPrismaError = error.code?.startsWith('P');
  let message = 'Erreur inconnue dans le service utilisateur.';
  let code = 'USER_SERVICE_ERROR';
  const severity: ErrorSeverity = 'error';

  if (error instanceof Error) {
    message = error.message;
  }

  if (isPrismaError) {
    code = error.code;
    // Messages Prisma plus explicites
    switch (error.code) {
      case 'P2002':
        message = 'Un utilisateur avec ce login ou email existe déjà.';
        break;
      case 'P2025':
        message = 'Utilisateur non trouvé.';
        break;
      default:
        message = `Erreur de base de données: ${error.message}`;
    }
  }

  return {
    message,
    code,
    severity,
    context: {
      ...(isPrismaError && { prismaCode: error.code }),
      ...context,
    },
  };
};

/**
 * Service Utilisateur Moderne avec Prisma
 */
export class UserServicePrisma {
  /**
   * Créer un nouvel utilisateur
   *
   * @description Crée un nouvel utilisateur avec hashage sécurisé du mot de passe,
   * gestion des rôles et affectation aux sites. Vérifie l'unicité du login et de l'email.
   *
   * @param {CreateUserInput} userData - Données du nouvel utilisateur
   * @param {string} userData.nom - Nom de famille
   * @param {string} userData.prenom - Prénom
   * @param {string} userData.login - Identifiant unique de connexion
   * @param {string} userData.email - Adresse email (doit être unique)
   * @param {string} userData.password - Mot de passe en clair (sera hashé)
   * @param {Role} userData.role - Rôle de l'utilisateur (USER, ADMIN_PARTIEL, ADMIN_TOTAL, MAR, IADE)
   * @param {string} [userData.departmentId] - ID du département (optionnel)
   * @param {string[]} [userData.siteIds] - IDs des sites d'affectation (optionnel)
   *
   * @returns {Promise<UserWithProfile>} Utilisateur créé avec ses relations
   *
   * @throws {Error} Si le login ou l'email existe déjà (code P2002)
   * @throws {Error} Si le département ou un site n'existe pas
   *
   * @example
   * const newUser = await UserServicePrisma.createUser({
   *   nom: 'Martin',
   *   prenom: 'Jean',
   *   login: 'jmartin',
   *   email: 'jean.martin@hospital.fr',
   *   password: 'SecurePass123!',
   *   role: 'MAR',
   *   siteIds: ['site1', 'site2']
   * });
   *
   * @security Le mot de passe est automatiquement hashé avec bcrypt (salt rounds: 10)
   */
  static async createUser(userData: CreateUserInput): Promise<UserWithProfile> {
    try {
      // Hash du mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Création avec relations
      const user = await prisma.user.create({
        data: {
          nom: userData.nom,
          prenom: userData.prenom,
          login: userData.login,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          departmentId: userData.departmentId,
          // Connexion aux sites si fournis
          ...(userData.siteIds &&
            userData.siteIds.length > 0 && {
              sites: {
                connect: userData.siteIds.map(id => ({ id })),
              },
            }),
        },
        include: {
          department: {
            select: { id: true, name: true },
          },
          sites: {
            select: { id: true, name: true },
          },
        },
      });

      return user;
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, {
        userData: { ...userData, password: '[HIDDEN]' },
      });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Trouver un utilisateur par ID
   */
  static async findUserById(userId: number): Promise<UserWithProfile | null> {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          department: {
            select: { id: true, name: true },
          },
          sites: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, { userId });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Trouver un utilisateur par login
   */
  static async findUserByLogin(login: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { login },
      });
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, { login });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Trouver un utilisateur par email
   */
  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, { email });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async updateUser(userId: number, userData: UpdateUserInput): Promise<UserWithProfile> {
    try {
      // Hash du nouveau mot de passe si fourni
      const updateData: any = { ...userData };
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(userData.password, salt);
      }

      // Gestion des sites
      if (userData.siteIds !== undefined) {
        updateData.sites = {
          set: userData.siteIds.map(id => ({ id })),
        };
        delete updateData.siteIds;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          department: {
            select: { id: true, name: true },
          },
          sites: {
            select: { id: true, name: true },
          },
        },
      });

      return user;
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, {
        userId,
        userData: { ...userData, password: userData.password ? '[HIDDEN]' : undefined },
      });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  static async deleteUser(userId: number): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
      return true;
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, { userId });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Supprimer définitivement un utilisateur
   */
  static async hardDeleteUser(userId: number): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
      return true;
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, { userId });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Rechercher des utilisateurs avec filtres
   */
  static async searchUsers(filters: UserSearchFilters = {}): Promise<{
    users: UserWithProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { search, role, department, site, isActive = true, page = 1, limit = 20 } = filters;

      // Construction des conditions de recherche
      const where: any = {
        isActive,
      };

      if (search) {
        where.OR = [
          { nom: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } },
          { login: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (department) {
        where.departmentId = department;
      }

      if (site) {
        where.sites = {
          some: { id: site },
        };
      }

      // Calcul pagination
      const skip = (page - 1) * limit;

      // Exécution des requêtes en parallèle
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            department: {
              select: { id: true, name: true },
            },
            sites: {
              select: { id: true, name: true },
            },
          },
          orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, { filters });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Lister tous les utilisateurs actifs
   */
  static async getAllActiveUsers(): Promise<UserWithProfile[]> {
    try {
      return await prisma.user.findMany({
        where: { isActive: true },
        include: {
          department: {
            select: { id: true, name: true },
          },
          sites: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      });
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error);
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Vérifier le mot de passe d'un utilisateur
   */
  static async verifyPassword(user: User, candidatePassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(candidatePassword, user.password);
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, { userId: user.id });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Changer le mot de passe d'un utilisateur
   */
  static async changePassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return true;
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error, { userId });
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<Role, number>;
  }> {
    try {
      const [total, active, byRole] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
      ]);

      const roleStats = byRole.reduce(
        (acc, { role, _count }) => {
          acc[role] = _count;
          return acc;
        },
        {} as Record<Role, number>
      );

      return {
        total,
        active,
        inactive: total - active,
        byRole: roleStats,
      };
    } catch (error) {
      const errorDetails = buildUserServiceErrorDetails(error);
      logError(errorDetails as ErrorDetails);
      throw error;
    }
  }
}

// Middleware de nettoyage Prisma
export const cleanupPrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};

// Export par défaut pour compatibilité
export default UserServicePrisma;
