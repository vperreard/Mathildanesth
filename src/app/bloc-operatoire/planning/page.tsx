import { Metadata } from 'next';
import BlocPlanningAdapter from './components/BlocPlanningAdapter';

export const metadata: Metadata = {
  title: 'Planning Bloc Opératoire | Mathildanesth',
  description: 'Gestion du planning des salles d\'opération',
};

export default function BlocOperatoirePlanningPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planning du Bloc Opératoire</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gérez les affectations et plannings des salles d'opération
        </p>
      </div>

      <BlocPlanningAdapter optimized={true} />
    </div>
  );
}