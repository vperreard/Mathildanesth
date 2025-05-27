'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { PermissionGuard } from '../_components/PermissionGuard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const SallesAdmin = dynamic(
  () => import('./components/SallesAdmin').then(mod => ({ default: mod.default || mod.SallesAdmin })),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
);

export default function SallesPage() {
  return (
    <PermissionGuard requiredRole="ADMIN">
      <Suspense fallback={<LoadingSpinner />}>
        <SallesAdmin />
      </Suspense>
    </PermissionGuard>
  );
}