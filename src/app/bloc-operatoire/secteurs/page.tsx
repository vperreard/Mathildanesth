'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PermissionGuard } from '../_components/PermissionGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const SecteursAdmin = dynamic(
  () => import('./components/SecteursAdmin').then(mod => ({ default: mod.default || mod.SecteursAdmin })),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);

export default function SecteursPage() {
  return (
    <PermissionGuard requiredRole="ADMIN">
      <Suspense fallback={<LoadingSpinner />}>
        <SecteursAdmin />
      </Suspense>
    </PermissionGuard>
  );
}