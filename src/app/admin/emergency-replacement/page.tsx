'use client';

import React from 'react';
import EmergencyReplacementMode from '@/components/admin/EmergencyReplacementMode';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmergencyReplacementPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/command-center')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au centre de commande
        </Button>
        
        <h1 className="text-3xl font-bold">Remplacement d'Urgence</h1>
        <p className="text-gray-600 mt-2">
          Trouvez rapidement un remplaçant pour les absences de dernière minute
        </p>
      </div>

      <EmergencyReplacementMode />
    </div>
  );
}