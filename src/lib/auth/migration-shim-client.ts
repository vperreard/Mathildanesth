/**
 * Module de compatibilité CLIENT pour la migration NextAuth → JWT Custom
 * Ce fichier contient uniquement les exports utilisables côté client
 */

import { useAuth } from '@/hooks/useAuth';

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