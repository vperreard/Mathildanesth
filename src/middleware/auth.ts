import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '@/services/userService';
import { UserRole } from '@/models/User';

interface AuthRequest extends Request {
    user?: {
        id: number;
        role: UserRole;
    };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
            id: number;
            role: UserRole;
        };

        const user = await UserService.findById(decoded.id);

        if (!user || !user.isActive) {
            throw new Error();
        }

        req.user = {
            id: user.id,
            role: user.role,
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Veuillez vous authentifier' });
    }
};

export const requireRole = (roles: UserRole[]) => {
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