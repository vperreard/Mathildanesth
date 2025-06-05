import * as jose from 'jose';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
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
  } catch (error) {
    console.error('Erreur lors de la comparaison des mots de passe:', error);
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
    role: 'ADMIN',
  },
  {
    id: 2,
    login: 'user',
    password: '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // mot de passe: user
    prenom: 'User',
    nom: 'Standard',
    email: 'user@exemple.fr',
    role: 'USER',
  },
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
        login: { label: 'Login', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
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
            const isPasswordValid =
              process.env.BYPASS_AUTH === 'true' || credentials.password === user?.login; // Mot de passe = nom d'utilisateur

            if (!user || !isPasswordValid) {
              console.log('Authentification échouée en mode développement');
              return null;
            }
          } else {
            // Mode production: utiliser Prisma
            user = await prisma?.user.findUnique({
              where: { login: credentials.login },
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
            role: user.role,
          };
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          return null;
        }
      },
    }),
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
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: JWT_SECRET,
};

/**
 * Crée un token JWT signé.
 *
 * @description Génère un token JWT sécurisé contenant les informations d'authentification
 * de l'utilisateur. Utilise l'algorithme HS256 avec une clé secrète configurée dans l'environnement.
 *
 * @param {TokenPayload} payload - Les données à inclure dans le token
 * @param {number} payload.userId - ID unique de l'utilisateur
 * @param {string} payload.login - Identifiant de connexion de l'utilisateur
 * @param {string} payload.role - Rôle de l'utilisateur (USER, MAR, IADE, ADMIN_PARTIEL, ADMIN_TOTAL)
 * @param {string | number | Date} [expiresIn='1h'] - Durée de validité du token
 *   - String: '2h', '7d', '30m' (format jose)
 *   - Number: secondes depuis maintenant
 *   - Date: date d'expiration absolue
 *
 * @returns {Promise<string>} Token JWT signé et encodé
 *
 * @example
 * // Token avec expiration par défaut (1 heure)
 * const token = await createToken({
 *   userId: 123,
 *   login: 'jmartin',
 *   role: 'MAR'
 * });
 *
 * // Token avec expiration personnalisée
 * const longToken = await createToken(payload, '7d'); // 7 jours
 * const shortToken = await createToken(payload, '30m'); // 30 minutes
 *
 * @security
 * - Utilise JWT_SECRET depuis l'environnement (JAMAIS en dur dans le code)
 * - Algorithme HS256 pour la signature symétrique
 * - Inclut automatiquement l'heure d'émission (iat)
 * - Le secret doit être changé en production
 *
 * @see verifyToken pour la vérification du token
 */
export async function createToken(
  payload: TokenPayload,
  expiresIn: string | number | Date = '1h'
): Promise<string> {
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
export async function verifyToken(
  token: string
): Promise<TokenPayload & jose.JWTVerifyResult['payload']> {
  const alg = 'HS256';

  try {
    const { payload } = await jose.jwtVerify(token, secretKey, {
      algorithms: [alg],
    });

    // Vérifier si le payload a la structure attendue (TokenPayload)
    if (
      typeof payload.userId !== 'number' ||
      typeof payload.login !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      throw new Error('Token invalide ou malformé');
    }

    return payload as TokenPayload & jose.JWTVerifyResult['payload'];
  } catch (error: any) {
    // Gérer les erreurs spécifiques de jose (ex: JWTExpired, JWTInvalid)
    // Ne pas logger en mode test pour éviter la pollution des logs
    if (process.env.NODE_ENV !== 'test') {
      console.error('Erreur de vérification du token:', error.code || error.message);
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
export async function getUserFromCookie(request: any): Promise<any> {
  try {
    // Récupérer le token depuis les cookies
    const token =
      request.cookies?.get?.('auth-token')?.value ||
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
        where: { id: payload.userId },
      });
      return user;
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
}
