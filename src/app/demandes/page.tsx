'use client';

import React from 'react';
import UnifiedRequestList from '@/components/requests/UnifiedRequestList';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RequestsPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mes demandes</h1>
        <p className="text-gray-600 mt-2">
          Gérez toutes vos demandes administratives en un seul endroit
        </p>
      </div>

      {user ? (
        <UnifiedRequestList 
          viewMode="user" 
          userId={user.id}
          showCreateButton={true}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Veuillez vous connecter pour accéder à vos demandes
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}