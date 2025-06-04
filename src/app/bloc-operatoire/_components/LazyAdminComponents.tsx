'use client';

import { Suspense, lazy } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/useAuth';

// Lazy loading des composants admin lourds
const SallesAdmin = lazy(() => 
  import('../salles/components/SallesAdmin')
);

const SecteursAdmin = lazy(() => 
  import('../secteurs/components/SecteursAdmin').then(mod => ({ 
    default: mod.default || mod.SecteursAdmin 
  }))
);

const ReglesSupervisionAdmin = lazy(() => 
  import('../regles/components/ReglesSupervisionAdmin').then(mod => ({ 
    default: mod.default || mod.ReglesSupervisionAdmin 
  }))
);

const OperatingRoomForm = lazy(() => 
  import('../salles/components/OperatingRoomForm')
);

// Loading fallback optimisé
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <LoadingSpinner size="lg" />
    <span className="ml-3 text-sm text-gray-600">Chargement du module...</span>
  </div>
);

// Wrapper avec vérification des permissions
interface LazyAdminWrapperProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'RESPONSABLE_BLOC';
}

const LazyAdminWrapper = ({ children, requiredRole = 'ADMIN' }: LazyAdminWrapperProps) => {
  const { user } = useAuth();
  
  if (!user || user.role !== requiredRole) {
    return null;
  }

  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      {children}
    </Suspense>
  );
};

// Composants exportés avec lazy loading
export const LazySallesAdmin = () => (
  <LazyAdminWrapper>
    <SallesAdmin />
  </LazyAdminWrapper>
);

export const LazySecteursAdmin = () => (
  <LazyAdminWrapper>
    <SecteursAdmin />
  </LazyAdminWrapper>
);

export const LazyReglesSupervisionAdmin = () => (
  <LazyAdminWrapper>
    <ReglesSupervisionAdmin />
  </LazyAdminWrapper>
);

export const LazyOperatingRoomForm = (props: any) => (
  <LazyAdminWrapper>
    <OperatingRoomForm {...props} />
  </LazyAdminWrapper>
);

// Hook pour précharger les composants admin
export const usePreloadAdminComponents = () => {
  const { user } = useAuth();
  
  const preloadComponents = () => {
    if (user?.role === 'ADMIN') {
      // Précharger les composants après un délai
      setTimeout(() => {
        import('../salles/components/SallesAdmin');
        import('../secteurs/components/SecteursAdmin');
        import('../regles/components/ReglesSupervisionAdmin');
      }, 2000);
    }
  };

  return { preloadComponents };
};