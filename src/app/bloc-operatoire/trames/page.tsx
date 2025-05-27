import { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

// Import dynamique du composant de trames
const TramesContent = dynamic(
  () => import('@/app/bloc-operatoire/trames/page').then(mod => mod.default),
  {
    loading: () => <TramesLoadingSkeleton />,
    ssr: false
  }
);

export const metadata: Metadata = {
  title: 'Trames - Bloc Opératoire | Mathildanesth',
  description: 'Gestion des modèles de planning réutilisables',
};

function TramesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function BlocOperatoireTramesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trames de Planning</h1>
          <p className="mt-1 text-sm text-gray-600">
            Créez et gérez des modèles de planning réutilisables
          </p>
        </div>
        <Link href="/bloc-operatoire/trames/nouveau">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle trame
          </Button>
        </Link>
      </div>

      <Suspense fallback={<TramesLoadingSkeleton />}>
        <TramesContent />
      </Suspense>
    </div>
  );
}