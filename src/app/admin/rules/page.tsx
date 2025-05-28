'use client';

import React from 'react';
import RuleBuilderInterface from '@/components/admin/RuleBuilderInterface';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RulesManagementPage() {
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
        
        <h1 className="text-3xl font-bold">Gestion des Règles</h1>
        <p className="text-gray-600 mt-2">
          Créez et gérez les règles métier qui s'appliquent à vos plannings
        </p>
      </div>

      <RuleBuilderInterface />
    </div>
  );
}