'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PermissionGuard } from '../_components/PermissionGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const BlocConfigurationAdmin = dynamic(
  () =>
    import('./components/BlocConfigurationAdmin').then(mod => ({
      default: mod.default || mod.BlocConfigurationAdmin,
    })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

export default function BlocConfigurationPage() {
  return (
    <PermissionGuard requiredRole="ADMIN">
      <Suspense fallback={<LoadingSpinner />}>
        <BlocConfigurationAdmin />
      </Suspense>
    </PermissionGuard>
  );
}
