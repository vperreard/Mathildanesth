import * as jose from 'jose';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Configuration JWT existante
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-dev-secret-change-me-in-production';

// Utilisez Prisma uniquement si nous ne sommes pas en mode développement sans base de données
const IS_DEV_MODE = process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AUTH === 'true';
const prisma = IS_DEV_MODE ? null : new PrismaClient();

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
    } catch (error) {
        console.error("Erreur lors de la comparaison des mots de passe:", error);
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

// Configuration NextAuth
export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 heures
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                login: { label: "Login", type: "text" },
                password: { label: "Mot de passe", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.login || !credentials?.password) {
                    return null;
                }

                try {
                    let user;

                    if (IS_DEV_MODE) {
                        // Mode développement: utiliser les utilisateurs mockés
                        user = devUsers.find(u => u.login === credentials.login);

                        // En développement, accepter n'importe quel mot de passe
                        const isPasswordValid = process.env.BYPASS_AUTH === 'true' ||
                            credentials.password === user?.login; // Mot de passe = nom d'utilisateur

                        if (!user || !isPasswordValid) {
                            console.log('Authentification échouée en mode développement');
                            return null;
                        }
                    } else {
                        // Mode production: utiliser Prisma
                        user = await prisma?.user.findUnique({
                            where: { login: credentials.login }
                        });

                        if (!user || !user.password) {
                            return null;
                        }

                        const isPasswordValid = await comparePasswords(credentials.password, user.password);

                        if (!isPasswordValid) {
                            return null;
                        }
                    }

                    return {
                        id: user.id.toString(),
                        name: `${user.prenom} ${user.nom}`,
                        email: user.email,
                        role: user.role
                    };
                } catch (error) {
                    console.error("Erreur d'authentification:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.userId = parseInt(user.id);
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token) {
                session.user.id = token.userId;
                session.user.role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: JWT_SECRET,
};

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
            throw new Error('Payload du token invalide');
        }

        return payload as TokenPayload & jose.JWTVerifyResult['payload'];
    } catch (error: any) {
        // Gérer les erreurs spécifiques de jose (ex: JWTExpired, JWTInvalid)
        console.error("Erreur de vérification du token:", error.code || error.message);
        if (error instanceof jose.errors.JWTExpired) {
            throw new Error('Token expiré');
        }
        throw new Error('Token invalide ou malformé');
    }
} 