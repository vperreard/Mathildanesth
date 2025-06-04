'use client';

import React from 'react';
import UnifiedRequestForm from '@/components/requests/UnifiedRequestForm';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <p>Veuillez vous connecter pour créer une demande.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/demandes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux demandes
        </Button>
        
        <h1 className="text-3xl font-bold">Nouvelle demande</h1>
        <p className="text-gray-600 mt-2">
          Créez une nouvelle demande administrative
        </p>
      </div>

      <UnifiedRequestForm userId={user.id} />
    </div>
  );
}