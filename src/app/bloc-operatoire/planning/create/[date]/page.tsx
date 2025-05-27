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
  title: 'Créer un Planning | Mathildanesth',
  description: 'Créer un nouveau planning pour le bloc opératoire',
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

interface CreatePlanningPageProps {
  params: { date: string };
}

export default function CreatePlanningPage({ params }: CreatePlanningPageProps) {
  // Valider le format de la date
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.date)) {
    notFound();
  }

  const selectedDate = new Date(params.date);
  if (isNaN(selectedDate.getTime())) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Créer un Planning - {selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Définissez les affectations pour cette journée
        </p>
      </div>

      <Suspense fallback={<EditorLoadingSkeleton />}>
        <BlocPlanningEditor date={params.date} mode="create" />
      </Suspense>
    </div>
  );
}