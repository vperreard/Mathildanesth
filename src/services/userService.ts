import User, { UserAttributes, UserRole } from '@/models/User';
import { Op } from 'sequelize';
import { logError } from './errorLoggingService';
import { ErrorSeverity, ErrorDetails } from '@/hooks/useErrorHandler';

const buildUserServiceErrorDetails = (error: any, context?: Record<string, any>): Omit<ErrorDetails, 'timestamp' | 'retry'> => {
    const isSequelizeError = error.name?.startsWith('Sequelize');
    let message = 'Erreur inconnue dans le service utilisateur.';
    let code = 'USER_SERVICE_ERROR';
    let severity: ErrorSeverity = 'error';

    if (error instanceof Error) {
        message = error.message;
    }
    if (isSequelizeError) {
        code = error.name;
    }

    const errorContext = {
        ...(isSequelizeError && { originalError: error.original?.message }),
        ...context,
    };

    return {
        message: message,
        code: code,
        severity: severity,
        context: errorContext,
    };
};

export class UserService {
    static async create(userData: Omit<UserAttributes, 'createdAt' | 'updatedAt'> & { id?: number }) {
        const operationKey = 'UserService.create';
        try {
            return await User.create(userData);
        } catch (error) {
            const errorDetails = buildUserServiceErrorDetails(error, { email: userData.email });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }

    static async findAll() {
        const operationKey = 'UserService.findAll';
        try {
            return await User.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']],
            });
        } catch (error) {
            const errorDetails = buildUserServiceErrorDetails(error);
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }

    static async findById(id: number) {
        const operationKey = 'UserService.findById';
        try {
            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] },
            });
            if (!user) {
                const notFoundError = new Error('Utilisateur non trouvé');
                (notFoundError as any).code = 'USER_NOT_FOUND';
                throw notFoundError;
            }
            return user;
        } catch (error) {
            const errorDetails = buildUserServiceErrorDetails(error, { userId: id });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }

    static async findByEmail(email: string) {
        const operationKey = 'UserService.findByEmail';
        try {
            const user = await User.findOne({
                where: { email },
            });
            if (!user) {
                const notFoundError = new Error('Utilisateur non trouvé');
                (notFoundError as any).code = 'USER_NOT_FOUND';
                throw notFoundError;
            }
            return user;
        } catch (error) {
            const errorDetails = buildUserServiceErrorDetails(error, { email });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }

    static async update(id: number, userData: Partial<UserAttributes>) {
        const operationKey = 'UserService.update';
        try {
            const [updated] = await User.update(userData, {
                where: { id },
            });
            if (!updated) {
                const notFoundError = new Error('Utilisateur non trouvé pour la mise à jour');
                (notFoundError as any).code = 'USER_NOT_FOUND';
                throw notFoundError;
            }
            return await this.findById(id);
        } catch (error) {
            const errorDetails = buildUserServiceErrorDetails(error, { userId: id });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }

    static async delete(id: number) {
        const operationKey = 'UserService.delete';
        try {
            const deleted = await User.destroy({
                where: { id },
            });
            if (!deleted) {
                const notFoundError = new Error('Utilisateur non trouvé pour la suppression');
                (notFoundError as any).code = 'USER_NOT_FOUND';
                throw notFoundError;
            }
            return true;
        } catch (error) {
            const errorDetails = buildUserServiceErrorDetails(error, { userId: id });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }

    static async findByRole(role: UserRole) {
        const operationKey = 'UserService.findByRole';
        try {
            return await User.findAll({
                where: { role },
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']],
            });
        } catch (error) {
            const errorDetails = buildUserServiceErrorDetails(error, { role });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }

    static async search(query: string) {
        const operationKey = 'UserService.search';
        try {
            return await User.findAll({
                where: {
                    [Op.or]: [
                        { firstName: { [Op.iLike]: `%${query}%` } },
                        { lastName: { [Op.iLike]: `%${query}%` } },
                        { email: { [Op.iLike]: `%${query}%` } },
                    ],
                },
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']],
            });
        } catch (error) {
            const errorDetails = buildUserServiceErrorDetails(error, { query });
            logError(operationKey, { ...errorDetails, timestamp: new Date() });
            throw error;
        }
    }
} 