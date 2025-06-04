'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Import dynamique du composant d'édition
const BlocPlanningEditor = dynamic(
  () => import('../../components/BlocPlanningEditor').catch(() => {
    return { 
      default: () => (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">Éditeur de planning en cours de migration...</p>
        </div>
      )
    };
  }),
  {
    loading: () => <LoadingSpinner size="lg" />,
    ssr: false
  }
);

export default function CreatePlanningPage() {
  const params = useParams();
  const date = params.date as string;

  // Valider le format de la date
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return <div>Date invalide</div>;
  }

  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) {
    return <div>Date invalide</div>;
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

      <BlocPlanningEditor date={date} mode="create" />
    </div>
  );
}