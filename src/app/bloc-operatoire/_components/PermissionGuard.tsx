'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionGuardProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
  requiredPermission?: string;
  fallbackUrl?: string;
  showError?: boolean;
}

export default function PermissionGuard({
  children,
  requiredRole,
  requiredPermission,
  fallbackUrl = '/bloc-operatoire',
  showError = true
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentification requise
          </h2>
          <p className="text-gray-600 mb-4">
            Vous devez être connecté pour accéder à cette section.
          </p>
          <Button onClick={() => router.push('/auth/connexion')}>
            Se connecter
          </Button>
        </div>
      );
    }
    router.replace(fallbackUrl);
    return null;
  }

  // Vérifier le rôle
  if (requiredRole && user.role !== requiredRole) {
    if (showError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Permissions insuffisantes
          </h2>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
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

  // Vérifier une permission spécifique (extensible pour le futur)
  if (requiredPermission) {
    // TODO: Implémenter la logique de permissions granulaires
    // Pour l'instant, on considère que ADMIN a toutes les permissions
    if (user.role !== 'ADMIN') {
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