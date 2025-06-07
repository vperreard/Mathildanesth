/**
 * Module de compatibilité pour la migration NextAuth → JWT Custom
 * Ce fichier contient les exports pour client ET serveur
 */

import { useAuth } from '@/hooks/useAuth';
import { Role } from '@prisma/client';

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
  
  const session: NextAuthSession | null = user && isAuthenticated ? {
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
 * Wrapper pour signIn
 * Redirige vers la page de connexion
 */
export async function signIn(provider?: string, options?: any) {
  if (typeof window !== 'undefined') {
    const callbackUrl = options?.callbackUrl || '/';
    window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }
}

/**
 * Wrapper pour signOut
 * Utilise la déconnexion JWT custom
 */
export async function signOut(options?: any) {
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      const callbackUrl = options?.callbackUrl || '/auth/signin';
      window.location.href = callbackUrl;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
}

// Configuration d'authentification compatible NextAuth
export const authOptions = {
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
  },
  callbacks: {
    jwt: async ({ token, user }: any) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }: any) => {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

/**
 * Version serveur de getServerSession adaptée pour JWT custom
 * Remplace getServerSession de NextAuth
 * NOTE: Cette fonction ne peut être utilisée que côté serveur
 */
export async function getServerSession(options?: any): Promise<NextAuthSession | null> {
  // Vérification que nous sommes côté serveur
  if (typeof window !== 'undefined') {
    console.warn('getServerSession appelée côté client - retourne null');
    return null;
  }

  try {
    // Import dynamique côté serveur seulement
    const { cookies } = await import('next/headers');
    const jwt = await import('jsonwebtoken');
    
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.id) {
      return null;
    }

    return {
      user: {
        id: decoded.id,
        email: decoded.email,
        name: `${decoded.prenom} ${decoded.nom}`,
        login: decoded.login,
        role: decoded.role as Role,
      },
      expires: new Date(decoded.exp * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
}