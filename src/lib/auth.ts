import * as jose from 'jose';
import { logger } from "./logger";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Configuration JWT existante
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-dev-secret-change-me-in-production';

// Utilisez Prisma uniquement si nous ne sommes pas en mode développement sans base de données
const IS_DEV_MODE = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AUTH === 'true';
const prismaClient = IS_DEV_MODE ? null : prisma;

const secretKey = new TextEncoder().encode(JWT_SECRET);

interface TokenPayload {
    userId: number;
    login: string;
    role: string;
}

// Fonction simple pour vérifier le mot de passe
async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
        // Si bcrypt est utilisé, sinon utiliser votre logique de comparaison
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error: unknown) {
        logger.error("Erreur lors de la comparaison des mots de passe:", { error: error });
        return false;
    }
}

// Utilisateurs pour le développement
const devUsers = [
    {
        id: 1,
        login: 'admin',
        password: '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // mot de passe: admin
        prenom: 'Admin',
        nom: 'Utilisateur',
        email: 'admin@exemple.fr',
        role: 'ADMIN'
    },
    {
        id: 2,
        login: 'user',
        password: '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // mot de passe: user
        prenom: 'User',
        nom: 'Standard',
        email: 'user@exemple.fr',
        role: 'USER'
    }
];

// NextAuth configuration has been removed - using custom JWT authentication only

/**
 * Crée un token JWT signé.
 * @param payload - Les données à inclure dans le token.
 * @param expiresIn - La durée de validité (ex: '2h', '7d'). Défaut: '1h'.
 * @returns Le token JWT signé.
 */
export async function createToken(payload: TokenPayload, expiresIn: string | number | Date = '1h'): Promise<string> {
    const alg = 'HS256'; // Algorithme de signature

    return await new jose.SignJWT({ ...payload })
        .setProtectedHeader({ alg })
        .setIssuedAt() // Date d'émission
        .setExpirationTime(expiresIn) // Date d'expiration
        .sign(secretKey);
}

/**
 * Vérifie un token JWT et retourne le payload décodé.
 * @param token - Le token JWT à vérifier.
 * @returns Le payload du token.
 * @throws {Error} Si le token est invalide, expiré ou malformé.
 */
export async function verifyToken(token: string): Promise<TokenPayload & jose.JWTVerifyResult['payload']> {
    const alg = 'HS256';

    try {
        const { payload } = await jose.jwtVerify(token, secretKey, {
            algorithms: [alg],
        });

        // Vérifier si le payload a la structure attendue (TokenPayload)
        if (typeof payload.userId !== 'number' || typeof payload.login !== 'string' || typeof payload.role !== 'string') {
            throw new Error('Token invalide ou malformé');
        }

        return payload as TokenPayload & jose.JWTVerifyResult['payload'];
    } catch (error: unknown) {
        // Gérer les erreurs spécifiques de jose (ex: JWTExpired, JWTInvalid)
        // Ne pas logger en mode test pour éviter la pollution des logs
        if (process.env.NODE_ENV !== 'test') {
            logger.error("Erreur de vérification du token:", error.code || error.message);
        }
        
        if (error instanceof jose.errors.JWTExpired) {
            throw new Error('Token expiré');
        }
        
        // Si c'est déjà notre propre erreur, la propager
        if (error.message === 'Token invalide ou malformé') {
            throw error;
        }
        
        throw new Error('Token invalide ou malformé');
    }
}

/**
 * Récupère l'utilisateur depuis le cookie de session
 */
export async function getUserFromCookie(request: unknown): Promise<unknown> {
    try {
        // Récupérer le token depuis les cookies
        const token = request.cookies?.get?.('auth-token')?.value || 
                     request.headers?.get?.('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return null;
        }

        // Vérifier le token
        const payload = await verifyToken(token);
        
        // En mode développement, retourner un utilisateur mockΓ
        if (IS_DEV_MODE) {
            return devUsers.find(u => u.id === payload.userId) || null;
        }

        // Récupérer l'utilisateur depuis la base de données
        if (prismaClient) {
            const user = await prismaClient.user.findUnique({
                where: { id: payload.userId }
            });
            return user;
        }

        return null;
    } catch (error: unknown) {
        logger.error('Erreur lors de la récupération de l\'utilisateur:', { error: error });
        return null;
    }
} 