import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '@/services/userService';
import type { Role } from '@prisma/client';

interface AuthRequest extends Request {
    user?: {
        id: number;
        role: Role;
    };
}

// Export du type Role depuis Prisma au lieu de Sequelize
export type { Role as UserRole } from '@prisma/client';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
            id: number;
            role: Role;
        };

        const user = await UserService.findUserById(decoded.id);

        if (!user || !user.actif) {
            throw new Error();
        }

        req.user = {
            id: user.id,
            role: user.role,
        };

        next();
    } catch (error: unknown) {
        res.status(401).json({ error: 'Veuillez vous authentifier' });
    }
};

export const requireRole = (roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Veuillez vous authentifier' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        next();
    };
}; 