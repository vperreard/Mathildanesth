'use client';

import dynamic from 'next/dynamic';
import { logger } from "../../../../lib/logger";
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Import dynamique depuis le nouveau dossier local
const BlocPlanningComponent = dynamic(
  () => import('./BlocPlanning').catch((error) => {
    logger.error('Erreur chargement BlocPlanning:', error instanceof Error ? error : new Error(String(error)));
    return { default: () => <PlaceholderComponent componentName="BlocPlanning" /> };
  }),
  {
    loading: () => <PlanningLoadingSkeleton />,
    ssr: false
  }
);

const OptimizedBlocPlanningComponent = dynamic(
  () => import('./OptimizedBlocPlanning').catch((error) => {
    logger.error('Erreur chargement OptimizedBlocPlanning:', error instanceof Error ? error : new Error(String(error)));
    return { default: () => <PlaceholderComponent componentName="OptimizedBlocPlanning" /> };
  }),
  {
    loading: () => <PlanningLoadingSkeleton />,
    ssr: false
  }
);

function PlanningLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderComponent({ componentName }: { componentName: string }) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <p className="text-gray-500">
        Composant {componentName} en cours de migration...
      </p>
      <p className="text-sm text-gray-400 mt-2">
        Le composant sera disponible après la migration complète.
      </p>
    </div>
  );
}

interface BlocPlanningAdapterProps {
  optimized?: boolean;
}

export default function BlocPlanningAdapter({ optimized = true }: BlocPlanningAdapterProps) {
  const Component = optimized ? OptimizedBlocPlanningComponent : BlocPlanningComponent;

  return (
    <Suspense fallback={<PlanningLoadingSkeleton />}>
      <div className="h-full">
        <Component />
      </div>
    </Suspense>
  );
}