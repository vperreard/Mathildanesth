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

export default function EditPlanningPage() {
  const params = useParams();
  const id = params.id as string;

  // Valider que l'ID est un nombre ou un UUID valide
  const isValidId = /^[0-9a-fA-F-]+$/.test(id);
  if (!isValidId) {
    return <div>ID invalide</div>;
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

      <BlocPlanningEditor planningId={id} mode="edit" />
    </div>
  );
}