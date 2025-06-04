'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionGuardProps {
  children: ReactNode;
  requiredRole?: 'ADMIN_TOTAL' | 'ADMIN_PARTIEL' | 'USER';
  requiredPermission?: string;
  fallbackUrl?: string;
  showError?: boolean;
}

function PermissionGuard({
  children,
  requiredRole,
  requiredPermission,
  fallbackUrl = '/bloc-operatoire',
  showError = true,
}: PermissionGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si non authentifié
  if (!user) {
    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentification requise</h2>
          <p className="text-gray-600 mb-4">
            Vous devez être connecté pour accéder à cette section.
          </p>
          <Button onClick={() => router.push('/auth/connexion')}>Se connecter</Button>
        </div>
      );
    }
    router.replace(fallbackUrl);
    return null;
  }

  // Vérifier le rôle avec hiérarchie
  const hasRequiredRole = () => {
    if (!requiredRole) return true;

    // Hiérarchie des rôles simplifiée : ADMIN_TOTAL > ADMIN_PARTIEL > USER
    const roleHierarchy = {
      ADMIN_TOTAL: 3,
      ADMIN_PARTIEL: 2,
      USER: 1,
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  };

  if (requiredRole && !hasRequiredRole()) {
    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Permissions insuffisantes</h2>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
            <br />
            Rôle requis: {requiredRole} - Votre rôle: {user.role}
          </p>
          <Button variant="outline" onClick={() => router.push(fallbackUrl)}>
            Retour
          </Button>
        </div>
      );
    }
    router.replace(fallbackUrl);
    return null;
  }

  // Vérifier une permission spécifique
  if (requiredPermission) {
    // Importer le système de permissions
    const { hasPermission, parsePermission } = await import('@/lib/permissions');

    // Vérifier si la permission est valide
    const permission = parsePermission(requiredPermission);
    if (!permission) {
      console.error(`Permission invalide: ${requiredPermission}`);
      router.replace(fallbackUrl);
      return null;
    }

    // Vérifier si l'utilisateur a la permission
    if (!hasPermission(user.role, permission)) {
      if (showError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Permission spécifique requise
            </h2>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas la permission "{requiredPermission}".
            </p>
            <Button variant="outline" onClick={() => router.push(fallbackUrl)}>
              Retour
            </Button>
          </div>
        );
      }
      router.replace(fallbackUrl);
      return null;
    }
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>;
}

export default PermissionGuard;
export { PermissionGuard };
