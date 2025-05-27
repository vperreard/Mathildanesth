'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PermissionGuard } from '../_components/PermissionGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const ReglesSupervisionAdmin = dynamic(
  () => import('./components/ReglesSupervisionAdmin').then(mod => ({ default: mod.default || mod.ReglesSupervisionAdmin })),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);

export default function ReglesPage() {
  return (
    <PermissionGuard requiredRole="ADMIN">
      <Suspense fallback={<LoadingSpinner />}>
        <ReglesSupervisionAdmin />
      </Suspense>
    </PermissionGuard>
  );
}