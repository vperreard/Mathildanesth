/**
 * Module de compatibilité temporaire pour la migration NextAuth → JWT Custom
 * Ce fichier permet de remplacer progressivement les imports NextAuth
 * sans casser le code existant
 */

import { useAuth } from '@/hooks/useAuth';
import { getAuthTokenServer, verifyAuthToken } from '@/lib/auth-server-utils';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Type pour matcher le format NextAuth Session
interface NextAuthSession {
  user: {
    id: number;
    email?: string;
    name?: string;
    login?: string;
    role: string;
  } | null;
  expires?: string;
}

/**
 * Remplace useSession de NextAuth
 * Adapte le format de useAuth pour matcher l'interface NextAuth
 */
export function useSession() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Adapter au format NextAuth
  const session: NextAuthSession | null = user ? {
    user: {
      id: user.id,
      email: user.email,
      name: `${user.prenom} ${user.nom}`,
      login: user.login,
      role: user.role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  } : null;

  return {
    data: session,
    status: isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated',
    update: async () => null, // Fonction no-op pour la compatibilité
  };
}

/**
 * Remplace getServerSession de NextAuth
 * Utilise notre système JWT pour récupérer la session côté serveur
 */
export async function getServerSession(authOptions?: any): Promise<NextAuthSession | null> {
  try {
    // Récupérer le token depuis les cookies/headers
    const token = await getAuthTokenServer();
    
    if (!token) {
      logger.info('[Migration Shim] Pas de token trouvé');
      return null;
    }

    // Vérifier le token
    const authResult = await verifyAuthToken(token);
    
    if (!authResult.authenticated || !authResult.userId) {
      logger.info('[Migration Shim] Token invalide ou expiré');
      return null;
    }

    // Récupérer l'utilisateur depuis la DB
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        login: true,
        role: true,
      },
    });

    if (!user) {
      logger.error('[Migration Shim] Utilisateur non trouvé pour ID:', authResult.userId);
      return null;
    }

    // Retourner au format NextAuth
    return {
      user: {
        id: user.id,
        email: user.email || undefined,
        name: `${user.prenom} ${user.nom}`,
        login: user.login,
        role: user.role,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    logger.error('[Migration Shim] Erreur lors de la récupération de session:', { error: error });
    return null;
  }
}

/**
 * Remplace SessionProvider de NextAuth
 * Pointe vers notre AuthProvider
 */
export { AuthProvider as SessionProvider } from '@/context/AuthContext';

/**
 * Fonctions signIn/signOut pour la compatibilité
 * Non utilisées dans notre système mais présentes pour éviter les erreurs
 */
export async function signIn() {
  logger.warn('[Migration Shim] signIn appelé - utiliser login() du hook useAuth à la place');
  throw new Error('signIn non supporté - utiliser login() du hook useAuth');
}

export async function signOut() {
  logger.warn('[Migration Shim] signOut appelé - utiliser logout() du hook useAuth à la place');
  throw new Error('signOut non supporté - utiliser logout() du hook useAuth');
}

/**
 * Export dummy authOptions pour la compatibilité
 * Certains fichiers importent authOptions mais ne l'utilisent pas vraiment
 */
export const authOptions = {
  providers: [],
  callbacks: {},
  secret: process.env.JWT_SECRET,
};

// Types pour la compatibilité
export type Session = NextAuthSession;
export type { JWT } from 'next-auth/jwt';