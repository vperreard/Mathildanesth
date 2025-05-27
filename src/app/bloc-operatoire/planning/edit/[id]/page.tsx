import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound } from 'next/navigation';

// Import dynamique du composant d'édition
const BlocPlanningEditor = dynamic(
  () => import('@/app/bloc-operatoire/components/BlocPlanningEditor').catch(() => {
    return { 
      default: () => (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">Éditeur de planning en cours de migration...</p>
        </div>
      )
    };
  }),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false
  }
);

export const metadata: Metadata = {
  title: 'Modifier le Planning | Mathildanesth',
  description: 'Modifier un planning existant du bloc opératoire',
};

function EditorLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

interface EditPlanningPageProps {
  params: { id: string };
}

export default function EditPlanningPage({ params }: EditPlanningPageProps) {
  // Valider que l'ID est un nombre ou un UUID valide
  const isValidId = /^[0-9a-fA-F-]+$/.test(params.id);
  if (!isValidId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Modifier le Planning
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Modifiez les affectations et les détails du planning
        </p>
      </div>

      <Suspense fallback={<EditorLoadingSkeleton />}>
        <BlocPlanningEditor planningId={params.id} mode="edit" />
      </Suspense>
    </div>
  );
}